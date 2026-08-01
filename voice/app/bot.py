"""Pipecat interview pipeline — one asyncio task per session (no per-user Docker)."""

from __future__ import annotations

import asyncio
import inspect
import logging
import os
from typing import Any

# nltk 3.10+ blocks site-packages under a project-root venv unless this is set.
os.environ.setdefault("NLTK_DISABLE_IMPORT_SECURITY", "1")

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import EndFrame, TTSSpeakFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.transports.base_transport import TransportParams
from pipecat.transports.smallwebrtc.connection import SmallWebRTCConnection
from pipecat.transports.smallwebrtc.transport import SmallWebRTCTransport

from app.config import get_settings
from app.events import SessionEventHub
from app.observer import SessionEventObserver
from app.voices import deepgram_voice
from app.worker_registry import registry

logger = logging.getLogger(__name__)


async def _send_app_message(connection: Any, payload: dict[str, Any]) -> None:
    if hasattr(connection, "send_app_message"):
        result = connection.send_app_message(payload)
    elif hasattr(connection, "send_message"):
        result = connection.send_message(payload)
    else:
        return

    # Pipecat 1.6 SmallWebRTC is synchronous; retain compatibility with
    # transports that expose an async sender.
    if inspect.isawaitable(result):
        await result


async def _queue_greeting_when_ready(
    *,
    task: Any,
    hub: SessionEventHub,
    greeting: str,
    client_connected: asyncio.Event,
    pipeline_started: asyncio.Event,
    session_ended: asyncio.Event,
) -> bool:
    """Queue the greeting only after media and the full pipeline are ready."""
    await client_connected.wait()
    await pipeline_started.wait()
    if session_ended.is_set():
        return False

    logger.info("Live session ready session=%s — greeting", hub.session_id)
    await hub.agent_state("speaking")
    # Text immediately so the UI is not silent if audio is still attaching.
    await hub.transcript("agent", greeting, final=True)
    await task.queue_frame(TTSSpeakFrame(greeting))
    return True


def _default_system_prompt(meta: dict[str, Any]) -> str:
    kind = meta.get("sessionKind") or "practice"
    track = meta.get("trackId") or "interview"
    return (
        "You are MockMatch, a calm professional interview coach and interviewer. "
        f"Session type: {kind}. Track: {track}. "
        "Ask one clear question at a time. Keep replies concise (1–3 short sentences) "
        "so speech feels snappy. Do not mention being an AI model brand. "
        "Stay on interview-prep topics."
    )


async def _build_stt_tts(voice_id: str):
    """Deepgram STT + TTS (one API key for both)."""
    settings = get_settings()
    if not settings.deepgram_api_key:
        raise RuntimeError("DEEPGRAM_API_KEY is required for STT/TTS.")

    from pipecat.services.deepgram.stt import DeepgramSTTService
    from pipecat.services.deepgram.tts import DeepgramTTSService
    from pipecat.transcriptions.language import Language

    dg_voice = deepgram_voice(voice_id)
    stt = DeepgramSTTService(
        api_key=settings.deepgram_api_key,
        settings=DeepgramSTTService.Settings(
            model=settings.deepgram_stt_model,
            language=Language.EN,
            interim_results=True,
            punctuate=True,
            # smart_format adds latency; skip for snappier turns
            smart_format=False,
            # End utterance quickly after silence (ms)
            endpointing=200,
            utterance_end_ms=1000,
        ),
    )
    tts = DeepgramTTSService(
        api_key=settings.deepgram_api_key,
        voice=dg_voice,
        settings=DeepgramTTSService.Settings(
            voice=dg_voice,
            model=dg_voice,
        ),
    )
    return stt, tts, "deepgram"


async def run_bot(
    webrtc_connection: SmallWebRTCConnection,
    session_meta: dict[str, Any],
) -> None:
    """Run a full-duplex interview pipeline until the peer disconnects."""
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise RuntimeError("OPENROUTER_API_KEY is required for the interview LLM.")

    session_id = str(session_meta.get("sessionId") or "")
    user_id = str(session_meta.get("userId") or "")
    hub = SessionEventHub(session_id=session_id, user_id=user_id)

    # Forward events over WebRTC data channel when available
    async def emit_dc(payload: dict[str, Any]) -> None:
        try:
            await _send_app_message(webrtc_connection, payload)
        except Exception:
            logger.debug("Datachannel send failed", exc_info=True)

    hub.on_local(emit_dc)

    voice_id = str(session_meta.get("voiceId") or "mellow")
    stt, tts, vendor = await _build_stt_tts(voice_id)
    logger.info(
        "Starting pipeline session=%s vendor=%s llm=%s",
        session_id,
        vendor,
        settings.pipecat_llm_model,
    )

    registry.inc_sessions()
    await hub.agent_state("idle")

    transport = SmallWebRTCTransport(
        webrtc_connection=webrtc_connection,
        params=TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
    )

    llm = OpenRouterLLMService(
        api_key=settings.openrouter_api_key,
        settings=OpenRouterLLMService.Settings(
            model=settings.pipecat_llm_model,
        ),
    )

    system = session_meta.get("systemPrompt") or _default_system_prompt(session_meta)
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system},
    ]
    context = LLMContext(messages)

    # Snappier VAD — shorter stop silence before user turn ends
    try:
        vad = SileroVADAnalyzer(
            params=VADParams(
                stop_secs=0.4,
                start_secs=0.15,
                min_volume=0.4,
            )
        )
    except TypeError:
        vad = SileroVADAnalyzer()

    context_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=vad,
            user_turn_stop_timeout=3.0,
            audio_idle_timeout=0.6,
        ),
    )

    # Early observer: user transcripts + VAD states from STT path
    user_events = SessionEventObserver(
        hub,
        label="user-events",
        observe_user=True,
        observe_agent=False,
    )
    # Late observer: TTS / bot speaking + agent transcript text
    agent_events = SessionEventObserver(
        hub,
        label="agent-events",
        observe_user=False,
        observe_agent=True,
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_events,
            context_aggregator.user(),
            llm,
            tts,
            agent_events,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )

    # enable_rtvi=False: our browser client is not the Pipecat RTVI JS SDK.
    # With RTVI on, the pipeline waits for a client handshake that never comes —
    # TTS then only drains when the session ends (matches "speaks on End click").
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=False,
        ),
        enable_rtvi=False,
    )

    greeting = "Hi — I'm your MockMatch interviewer. Ready when you are."
    client_connected = asyncio.Event()
    pipeline_started = asyncio.Event()
    session_ended = asyncio.Event()

    greeting_task = asyncio.create_task(
        _queue_greeting_when_ready(
            task=task,
            hub=hub,
            greeting=greeting,
            client_connected=client_connected,
            pipeline_started=pipeline_started,
            session_ended=session_ended,
        )
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _conn):
        logger.info("Client connected session=%s", session_id)
        client_connected.set()

    @task.event_handler("on_pipeline_started")
    async def on_pipeline_started(_task, _frame):
        pipeline_started.set()
        await hub.publish({"type": "session_status", "status": "live"})
        await hub.agent_state("idle")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _conn):
        logger.info("Client disconnected session=%s", session_id)
        session_ended.set()
        await task.queue_frame(EndFrame())

    try:
        runner = PipelineRunner(handle_sigint=False)
        await runner.run(task)
        await hub.flush_final("ended")
    except Exception:
        logger.exception("Pipeline failed session=%s", session_id)
        await hub.flush_final("error")
        raise
    finally:
        session_ended.set()
        if not greeting_task.done():
            greeting_task.cancel()
            try:
                await greeting_task
            except asyncio.CancelledError:
                pass
        registry.dec_sessions()
        await hub.close()

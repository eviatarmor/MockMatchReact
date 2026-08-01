"""FastAPI signaling server + concurrent Pipecat session tasks."""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any

# Must be set before any pipecat/nltk import (project-root venv path).
os.environ.setdefault("NLTK_DISABLE_IMPORT_SECURITY", "1")

import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.bot import run_bot
from app.config import get_settings
from app.tickets import consume_ticket
from app.worker_registry import registry

logger = logging.getLogger("mockmatch.voice")


class OfferRequest(BaseModel):
    sdp: str
    type: str
    ticket: str = Field(..., min_length=16)
    sessionId: str | None = None


class OfferResponse(BaseModel):
    sdp: str
    type: str
    sessionId: str
    iceServers: list[dict[str, Any]] = Field(default_factory=list)


def _ice_servers_payload() -> list[dict[str, Any]]:
    settings = get_settings()
    servers: list[dict[str, Any]] = []
    for u in settings.ice_stun_urls.split(","):
        u = u.strip()
        if u:
            servers.append({"urls": [u]})
    turn_urls = [u.strip() for u in settings.ice_turn_urls.split(",") if u.strip()]
    if turn_urls and settings.ice_turn_username and settings.ice_turn_credential:
        servers.append(
            {
                "urls": turn_urls,
                "username": settings.ice_turn_username,
                "credential": settings.ice_turn_credential,
            }
        )
    return servers


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper())
    await registry.start()
    logger.info(
        "Voice service starting on %s:%s worker=%s (task-per-session; no GPU)",
        settings.voice_host,
        settings.voice_port,
        registry.worker_id,
    )
    yield
    await registry.stop()


app = FastAPI(title="MockMatch Voice", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "voice", "workerId": registry.worker_id}


@app.get("/ready")
async def ready() -> dict[str, Any]:
    settings = get_settings()
    stt_ok = bool(settings.deepgram_api_key)
    llm_ok = bool(settings.openrouter_api_key)
    return {
        "status": "ok" if stt_ok and llm_ok else "degraded",
        "llm": llm_ok,
        "stt_tts": stt_ok,
        "stt_model": settings.deepgram_stt_model if stt_ok else None,
        "tts_provider": "deepgram" if stt_ok else None,
        "model": settings.pipecat_llm_model,
        "workerId": registry.worker_id,
        "sessions": registry._sessions,
    }


@app.post("/api/offer", response_model=OfferResponse)
async def offer(body: OfferRequest, background_tasks: BackgroundTasks) -> OfferResponse:
    """
    WebRTC offer/answer signaling for SmallWebRTC.
    Client must supply the API-minted voice ticket.
    Sticky: client must hit the worker URL returned at session create.
    """
    meta = await consume_ticket(body.ticket)
    if not meta:
        raise HTTPException(status_code=401, detail="Invalid or expired voice ticket")

    session_id = meta["sessionId"]
    if body.sessionId and body.sessionId != session_id:
        raise HTTPException(status_code=400, detail="sessionId mismatch")

    settings = get_settings()
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY not configured")
    if not settings.deepgram_api_key:
        raise HTTPException(
            status_code=503,
            detail="Configure DEEPGRAM_API_KEY for STT/TTS",
        )

    try:
        from pipecat.transports.smallwebrtc.connection import (
            IceServer,
            SmallWebRTCConnection,
        )
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipecat WebRTC not installed: {e}",
        ) from e

    ice: list[Any] = []
    for u in settings.ice_stun_urls.split(","):
        u = u.strip()
        if u:
            ice.append(IceServer(urls=[u]))
    turn_urls = [u.strip() for u in settings.ice_turn_urls.split(",") if u.strip()]
    if turn_urls and settings.ice_turn_username and settings.ice_turn_credential:
        ice.append(
            IceServer(
                urls=turn_urls,
                username=settings.ice_turn_username,
                credential=settings.ice_turn_credential,
            )
        )

    connection = SmallWebRTCConnection(ice_servers=ice or None)
    await connection.initialize(sdp=body.sdp, type=body.type)

    answer = connection.get_answer()
    if not answer:
        raise HTTPException(status_code=500, detail="Failed to create WebRTC answer")

    async def _run() -> None:
        try:
            await run_bot(connection, meta)
        except Exception:
            logger.exception("Pipeline failed session=%s", session_id)

    background_tasks.add_task(_run)

    return OfferResponse(
        sdp=answer["sdp"],
        type=answer["type"],
        sessionId=session_id,
        iceServers=_ice_servers_payload(),
    )


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.voice_host,
        port=settings.voice_port,
        reload=False,
    )


if __name__ == "__main__":
    main()

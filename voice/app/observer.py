"""Pipecat frame observer → agent_state + transcript events."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from pipecat.frames.frames import (
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    Frame,
    InterimTranscriptionFrame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMTextFrame,
    TranscriptionFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
    TTSTextFrame,
    TextFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
    VADUserStartedSpeakingFrame,
    VADUserStoppedSpeakingFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

if TYPE_CHECKING:
    from app.events import SessionEventHub

logger = logging.getLogger(__name__)


class SessionEventObserver(FrameProcessor):
    """
    Emits UI events for robot state + transcript.

    Place **early** (after STT) for user speech/transcripts and **late**
    (after TTS) for agent speaking — or both (same hub; state is idempotent).

    Speaking is held until transport *playback* ends (BotStoppedSpeaking), not
    merely until TTS finishes generating (TTSStopped). That gap is what made the
    mouth freeze while audio still played. User VAD is ignored while the bot is
    speaking (echo / AEC bleed).
    """

    def __init__(
        self,
        hub: SessionEventHub,
        *,
        label: str = "events",
        observe_user: bool = True,
        observe_agent: bool = True,
    ):
        super().__init__(name=label)
        self._hub = hub
        self._assistant_buf: list[str] = []
        self._label = label
        self._observe_user = observe_user
        self._observe_agent = observe_agent
        # True once transport reports real playback for the current utterance.
        self._saw_bot_playback = False

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        try:
            # --- User speaking (VAD / aggregator) ---
            # Skip presence flips while bot audio is out — mic often hears TTS.
            if self._observe_user and not self._hub.bot_speaking and isinstance(
                frame,
                (UserStartedSpeakingFrame, VADUserStartedSpeakingFrame),
            ):
                await self._hub.agent_state("listening")
            elif self._observe_user and not self._hub.bot_speaking and isinstance(
                frame,
                (UserStoppedSpeakingFrame, VADUserStoppedSpeakingFrame),
            ):
                await self._hub.agent_state("thinking")

            # --- User transcript (always; useful even during barge-in) ---
            elif self._observe_user and isinstance(frame, TranscriptionFrame):
                text = (getattr(frame, "text", None) or "").strip()
                if text:
                    await self._hub.transcript("user", text, final=True)
            elif self._observe_user and isinstance(frame, InterimTranscriptionFrame):
                text = (getattr(frame, "text", None) or "").strip()
                if text:
                    await self._hub.publish(
                        {
                            "type": "transcript",
                            "role": "user",
                            "text": text,
                            "final": False,
                            "id": "interim-user",
                        }
                    )

            # --- LLM / agent speech ---
            elif self._observe_agent and isinstance(frame, LLMFullResponseStartFrame):
                self._assistant_buf = []
                if not self._hub.bot_speaking:
                    await self._hub.agent_state("thinking")
            elif self._observe_agent and isinstance(frame, BotStartedSpeakingFrame):
                self._saw_bot_playback = True
                await self._hub.agent_state("speaking")
            elif self._observe_agent and isinstance(frame, TTSStartedFrame):
                # Lipsync early (generation start) even before first PCM out.
                await self._hub.agent_state("speaking")
            elif self._observe_agent and isinstance(frame, BotStoppedSpeakingFrame):
                self._saw_bot_playback = False
                await self._hub.agent_state("idle")
                await self._flush_assistant_buf()
            elif self._observe_agent and isinstance(frame, TTSStoppedFrame):
                # Generation done. If transport never emitted Bot* frames, fall
                # back to idle here; otherwise keep speaking until BotStopped so
                # the mouth matches the audio the user still hears.
                await self._flush_assistant_buf()
                if not self._saw_bot_playback:
                    await self._hub.agent_state("idle")
            elif self._observe_agent and isinstance(frame, LLMFullResponseEndFrame):
                pass
            elif self._observe_agent and isinstance(
                frame, (LLMTextFrame, TTSTextFrame, TextFrame)
            ):
                text = getattr(frame, "text", None)
                if text:
                    self._assistant_buf.append(str(text))

        except Exception:
            logger.exception(
                "Observer(%s) error on %s", self._label, type(frame).__name__
            )

        await self.push_frame(frame, direction)

    async def _flush_assistant_buf(self) -> None:
        if not self._assistant_buf:
            return
        full = "".join(self._assistant_buf).strip()
        self._assistant_buf = []
        if full:
            await self._hub.transcript("agent", full, final=True)

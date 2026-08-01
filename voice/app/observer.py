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

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        try:
            # --- User speaking (VAD / aggregator) ---
            if self._observe_user and isinstance(
                frame,
                (UserStartedSpeakingFrame, VADUserStartedSpeakingFrame),
            ):
                await self._hub.agent_state("listening")
            elif self._observe_user and isinstance(
                frame,
                (UserStoppedSpeakingFrame, VADUserStoppedSpeakingFrame),
            ):
                await self._hub.agent_state("thinking")

            # --- User transcript ---
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
                await self._hub.agent_state("thinking")
            elif self._observe_agent and isinstance(
                frame, (TTSStartedFrame, BotStartedSpeakingFrame)
            ):
                await self._hub.agent_state("speaking")
            elif self._observe_agent and isinstance(
                frame, (TTSStoppedFrame, BotStoppedSpeakingFrame)
            ):
                await self._hub.agent_state("idle")
                if self._assistant_buf:
                    full = "".join(self._assistant_buf).strip()
                    self._assistant_buf = []
                    if full:
                        await self._hub.transcript("agent", full, final=True)
            elif self._observe_agent and isinstance(frame, LLMFullResponseEndFrame):
                # Prefer flushing on TTS stop so text lines up with audio;
                # if buffer still present and no TTS, flush on end.
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

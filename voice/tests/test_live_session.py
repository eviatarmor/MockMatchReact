from __future__ import annotations

import asyncio
import unittest
from unittest.mock import AsyncMock, Mock, patch

from pipecat.frames.frames import (
    TTSStoppedFrame,
    TextFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from app.bot import _queue_greeting_when_ready, _send_app_message
from app.observer import SessionEventObserver


class FakeHub:
    def __init__(self) -> None:
        self.session_id = "session-test"
        self.states: list[str] = []
        self.transcripts: list[tuple[str, str, bool]] = []
        self.published: list[dict[str, object]] = []

    async def agent_state(self, state: str) -> None:
        self.states.append(state)

    async def transcript(self, role: str, text: str, *, final: bool = True) -> None:
        self.transcripts.append((role, text, final))

    async def publish(self, event: dict[str, object]) -> None:
        self.published.append(event)


class LiveSessionLifecycleTests(unittest.IsolatedAsyncioTestCase):
    async def test_greeting_waits_for_connection_and_pipeline(self) -> None:
        task = Mock()
        task.queue_frame = AsyncMock()
        hub = FakeHub()
        connected = asyncio.Event()
        started = asyncio.Event()
        ended = asyncio.Event()

        pending = asyncio.create_task(
            _queue_greeting_when_ready(
                task=task,
                hub=hub,
                greeting="Hello",
                client_connected=connected,
                pipeline_started=started,
                session_ended=ended,
            )
        )
        connected.set()
        await asyncio.sleep(0)
        task.queue_frame.assert_not_awaited()

        started.set()
        self.assertTrue(await pending)
        task.queue_frame.assert_awaited_once()
        self.assertEqual(hub.states, ["speaking"])
        self.assertEqual(hub.transcripts, [("agent", "Hello", True)])

    async def test_ended_session_never_queues_greeting(self) -> None:
        task = Mock()
        task.queue_frame = AsyncMock()
        hub = FakeHub()
        connected = asyncio.Event()
        started = asyncio.Event()
        ended = asyncio.Event()
        started.set()
        ended.set()

        pending = asyncio.create_task(
            _queue_greeting_when_ready(
                task=task,
                hub=hub,
                greeting="Hello",
                client_connected=connected,
                pipeline_started=started,
                session_ended=ended,
            )
        )
        connected.set()

        self.assertFalse(await pending)
        task.queue_frame.assert_not_awaited()
        self.assertEqual(hub.states, [])

    async def test_sync_pipecat_data_channel_sender_is_supported(self) -> None:
        connection = Mock()
        connection.send_app_message.return_value = None
        payload = {"type": "agent_state", "state": "listening"}

        await _send_app_message(connection, payload)

        connection.send_app_message.assert_called_once_with(payload)

    async def test_async_data_channel_sender_remains_supported(self) -> None:
        connection = Mock()
        connection.send_app_message = AsyncMock()
        payload = {"type": "session_status", "status": "live"}

        await _send_app_message(connection, payload)

        connection.send_app_message.assert_awaited_once_with(payload)


class SessionEventObserverTests(unittest.IsolatedAsyncioTestCase):
    async def _process(self, observer: SessionEventObserver, frame: object) -> None:
        with (
            patch.object(FrameProcessor, "process_frame", new=AsyncMock()),
            patch.object(observer, "push_frame", new=AsyncMock()),
        ):
            await observer.process_frame(frame, FrameDirection.DOWNSTREAM)

    async def test_user_observer_emits_only_user_presence(self) -> None:
        hub = FakeHub()
        observer = SessionEventObserver(
            hub,
            label="user-test",
            observe_user=True,
            observe_agent=False,
        )

        await self._process(observer, UserStartedSpeakingFrame())
        await self._process(observer, UserStoppedSpeakingFrame())
        await self._process(observer, TextFrame("ignored agent text"))
        await self._process(observer, TTSStoppedFrame())

        self.assertEqual(hub.states, ["listening", "thinking"])
        self.assertEqual(hub.transcripts, [])

    async def test_agent_observer_flushes_text_on_tts_stop(self) -> None:
        hub = FakeHub()
        observer = SessionEventObserver(
            hub,
            label="agent-test",
            observe_user=False,
            observe_agent=True,
        )

        await self._process(observer, TextFrame("Hello from the interviewer."))
        await self._process(observer, TTSStoppedFrame())

        self.assertEqual(hub.states, ["idle"])
        self.assertEqual(
            hub.transcripts,
            [("agent", "Hello from the interviewer.", True)],
        )


if __name__ == "__main__":
    unittest.main()

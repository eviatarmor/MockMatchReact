"""Session event bus: Redis pub/sub + in-memory transcript buffer + API flush."""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, Callable, Awaitable

import httpx
import redis.asyncio as redis

from app.config import get_settings

logger = logging.getLogger(__name__)

EmitFn = Callable[[dict[str, Any]], Awaitable[None] | None]


class SessionEventHub:
    def __init__(self, session_id: str, user_id: str) -> None:
        self.session_id = session_id
        self.user_id = user_id
        self.turns: list[dict[str, Any]] = []
        self._emit_local: list[EmitFn] = []
        self._redis: redis.Redis | None = None

    def on_local(self, fn: EmitFn) -> None:
        self._emit_local.append(fn)

    async def _redis_client(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(
                get_settings().redis_url, decode_responses=True
            )
        return self._redis

    async def publish(self, event: dict[str, Any]) -> None:
        payload = {
            **event,
            "sessionId": self.session_id,
            "ts": int(time.time() * 1000),
        }
        raw = json.dumps(payload)
        try:
            r = await self._redis_client()
            await r.publish(f"voice:events:{self.session_id}", raw)
        except Exception:
            logger.exception("Redis publish failed session=%s", self.session_id)

        for fn in self._emit_local:
            try:
                result = fn(payload)
                if hasattr(result, "__await__"):
                    await result  # type: ignore[misc]
            except Exception:
                logger.exception("Local emit failed")

    async def agent_state(self, state: str) -> None:
        await self.publish({"type": "agent_state", "state": state})

    async def transcript(
        self,
        role: str,
        text: str,
        *,
        final: bool = True,
        turn_id: str | None = None,
    ) -> None:
        tid = turn_id or str(uuid.uuid4())
        clean = (text or "").strip()
        if not clean:
            return
        event = {
            "type": "transcript",
            "role": role,
            "text": clean,
            "final": final,
            "id": tid,
        }
        if final:
            self.turns.append(
                {
                    "id": tid,
                    "role": role,
                    "text": clean,
                    "at": int(time.time() * 1000),
                }
            )
            # Fire-and-forget flush — don't block the pipeline turn
            import asyncio

            asyncio.create_task(self._flush_partial())
        await self.publish(event)

    async def _flush_partial(self) -> None:
        settings = get_settings()
        if not settings.api_internal_url or not settings.voice_worker_secret:
            return
        url = f"{settings.api_internal_url.rstrip('/')}/voice/internal/transcript"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    url,
                    headers={"Authorization": f"Bearer {settings.voice_worker_secret}"},
                    json={
                        "sessionId": self.session_id,
                        "userId": self.user_id,
                        "transcript": self.turns,
                        "final": False,
                    },
                )
        except Exception:
            logger.exception("Partial transcript flush failed")

    async def flush_final(self, status: str = "ended") -> None:
        settings = get_settings()
        await self.publish({"type": "session_status", "status": status})
        if not settings.api_internal_url or not settings.voice_worker_secret:
            logger.warning("Skip final flush — API_INTERNAL_URL or VOICE_WORKER_SECRET unset")
            return
        url = f"{settings.api_internal_url.rstrip('/')}/voice/internal/transcript"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {settings.voice_worker_secret}"},
                    json={
                        "sessionId": self.session_id,
                        "userId": self.user_id,
                        "transcript": self.turns,
                        "final": True,
                        "status": status,
                    },
                )
                res.raise_for_status()
        except Exception:
            logger.exception("Final transcript flush failed session=%s", self.session_id)

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()
            self._redis = None

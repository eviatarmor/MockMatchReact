"""Register this voice worker in Redis for sticky offer routing."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import socket
import time
import uuid

import redis.asyncio as redis

from app.config import get_settings

logger = logging.getLogger(__name__)

WORKERS_KEY = "voice:workers"
WORKER_TTL = 30


class WorkerRegistry:
    def __init__(self) -> None:
        settings = get_settings()
        self.worker_id = settings.worker_id or f"{socket.gethostname()}-{os.getpid()}-{uuid.uuid4().hex[:8]}"
        self.public_url = (settings.public_url or f"http://127.0.0.1:{settings.voice_port}").rstrip(
            "/"
        )
        self._redis: redis.Redis | None = None
        self._task: asyncio.Task | None = None
        self._sessions = 0

    async def start(self) -> None:
        self._redis = redis.from_url(get_settings().redis_url, decode_responses=True)
        await self._heartbeat()
        self._task = asyncio.create_task(self._loop())
        logger.info("Registered voice worker id=%s url=%s", self.worker_id, self.public_url)

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._redis:
            await self._redis.hdel(WORKERS_KEY, self.worker_id)
            await self._redis.aclose()
            self._redis = None

    def inc_sessions(self) -> None:
        self._sessions += 1

    def dec_sessions(self) -> None:
        self._sessions = max(0, self._sessions - 1)

    async def _loop(self) -> None:
        while True:
            try:
                await self._heartbeat()
            except Exception:
                logger.exception("Worker heartbeat failed")
            await asyncio.sleep(10)

    async def _heartbeat(self) -> None:
        if not self._redis:
            return
        payload = {
            "id": self.worker_id,
            "publicUrl": self.public_url,
            "sessions": self._sessions,
            "ts": int(time.time()),
        }
        await self._redis.hset(WORKERS_KEY, self.worker_id, json.dumps(payload))
        # Soft expiry via timestamp check on API side; also set a per-worker key
        await self._redis.setex(
            f"voice:worker:{self.worker_id}:alive",
            WORKER_TTL,
            "1",
        )


registry = WorkerRegistry()

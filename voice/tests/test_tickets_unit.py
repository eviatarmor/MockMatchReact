"""Unit tests for voice ticket JWT validation (no Redis)."""

from __future__ import annotations

import unittest
from unittest.mock import AsyncMock, patch

import jwt

from app import tickets


class TicketJwtTests(unittest.IsolatedAsyncioTestCase):
    async def test_invalid_jwt_returns_none(self) -> None:
        with patch.object(tickets, "get_settings") as gs:
            gs.return_value.jwt_access_secret = "test-secret-at-least-32-chars!!"
            gs.return_value.voice_ticket_audience = "voice"
            result = await tickets.consume_ticket("not-a-jwt")
            self.assertIsNone(result)

    async def test_wrong_type_returns_none(self) -> None:
        secret = "test-secret-at-least-32-chars!!"
        token = jwt.encode(
            {
                "sub": "user-1",
                "type": "access",
                "sid": "sess-1",
                "jti": "jti-1",
                "aud": "voice",
            },
            secret,
            algorithm="HS256",
        )
        with patch.object(tickets, "get_settings") as gs:
            gs.return_value.jwt_access_secret = secret
            gs.return_value.voice_ticket_audience = "voice"
            result = await tickets.consume_ticket(token)
            self.assertIsNone(result)

    async def test_valid_ticket_with_redis_hit(self) -> None:
        secret = "test-secret-at-least-32-chars!!"
        token = jwt.encode(
            {
                "sub": "user-1",
                "type": "voice_ticket",
                "sid": "sess-1",
                "jti": "jti-1",
                "aud": "voice",
            },
            secret,
            algorithm="HS256",
        )
        fake_redis = AsyncMock()
        fake_redis.get = AsyncMock(
            return_value='{"sessionId":"sess-1","userId":"user-1","voiceId":"buttery"}'
        )

        with (
            patch.object(tickets, "get_settings") as gs,
            patch.object(tickets, "get_redis", AsyncMock(return_value=fake_redis)),
        ):
            gs.return_value.jwt_access_secret = secret
            gs.return_value.voice_ticket_audience = "voice"
            result = await tickets.consume_ticket(token)
            self.assertIsNotNone(result)
            assert result is not None
            self.assertEqual(result["userId"], "user-1")
            self.assertEqual(result["sessionId"], "sess-1")
            self.assertEqual(result["voiceId"], "buttery")

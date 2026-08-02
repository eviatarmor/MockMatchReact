"""Validate short-lived voice session tickets stored by the API in Redis."""

from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis
import jwt
from jwt.exceptions import InvalidTokenError

from app.config import get_settings

TICKET_PREFIX = "voice:ticket"


async def get_redis() -> redis.Redis:
    settings = get_settings()
    return redis.from_url(settings.redis_url, decode_responses=True)


async def consume_ticket(ticket: str) -> dict[str, Any] | None:
    """
    Verify JWT signature + audience and ensure Redis still holds the ticket.
    Ticket remains valid until TTL so WebRTC reconnect can re-offer.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            ticket,
            settings.jwt_access_secret,
            algorithms=["HS256"],
            audience=settings.voice_ticket_audience,
        )
    except InvalidTokenError:
        return None

    if payload.get("type") != "voice_ticket":
        return None

    jti = payload.get("jti")
    session_id = payload.get("sid")
    user_id = payload.get("sub")
    if not jti or not session_id or not user_id:
        return None

    r = await get_redis()
    key = f"{TICKET_PREFIX}:{jti}"
    raw = await r.get(key)
    if not raw:
        return None

    try:
        record = json.loads(raw)
    except json.JSONDecodeError:
        return None

    if record.get("sessionId") != session_id or record.get("userId") != user_id:
        return None

    return {
        "userId": user_id,
        "sessionId": session_id,
        "jti": jti,
        "voiceId": record.get("voiceId") or "buttery",
        "sessionKind": record.get("sessionKind") or "practice",
        "trackId": record.get("trackId") or "",
        "analyzeFace": bool(record.get("analyzeFace")),
        "analyzePosture": bool(record.get("analyzePosture")),
        "systemPrompt": record.get("systemPrompt") or "",
    }

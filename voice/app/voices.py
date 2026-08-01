"""Map MockMatch product voice ids → Deepgram Aura-2 TTS models."""

from __future__ import annotations

# Deepgram Aura-2 English TTS (must match client VOICE_CATALOG).
# Docs: https://developers.deepgram.com/docs/tts-models
DEEPGRAM_VOICE_MAP: dict[str, str] = {
    "buttery": "aura-2-athena-en",  # Calm, smooth, professional (US)
    "resonant": "aura-2-orion-en",  # Approachable, calm (US)
    "mellow": "aura-2-helena-en",  # Caring, natural, friendly (US) — default
    "airy": "aura-2-arcas-en",  # Natural, smooth, clear (US)
    "polished": "aura-2-pandora-en",  # Smooth, calm British
    "rounded": "aura-2-draco-en",  # Warm, trustworthy British
}

DEFAULT_DEEPGRAM_VOICE = DEEPGRAM_VOICE_MAP["mellow"]


def deepgram_voice(voice_id: str) -> str:
    return DEEPGRAM_VOICE_MAP.get(voice_id, DEFAULT_DEEPGRAM_VOICE)

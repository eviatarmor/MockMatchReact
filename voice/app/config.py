from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    voice_host: str = "0.0.0.0"
    voice_port: int = 7860
    # Public URL clients use for this worker (sticky routing).
    public_url: str = "http://localhost:7860"
    worker_id: str = ""

    redis_url: str = "redis://127.0.0.1:6379"
    jwt_access_secret: str = "dev-access-secret-change-me-32chars"
    voice_ticket_audience: str = "voice"

    # API base for internal transcript flush (server-to-server).
    api_internal_url: str = "http://localhost:3000"
    voice_worker_secret: str = "dev-voice-worker-secret-change-me"

    openrouter_api_key: str = ""
    pipecat_llm_model: str = "google/gemma-4-26b-a4b-it:free"

    # Deepgram — STT + TTS (primary).
    deepgram_api_key: str = ""
    # Cheapest English streaming STT (monolingual Nova-3).
    deepgram_stt_model: str = "nova-3"

    log_level: str = "info"

    # ICE STUN (comma-separated). TURN optional.
    ice_stun_urls: str = "stun:stun.l.google.com:19302"
    ice_turn_urls: str = ""
    ice_turn_username: str = ""
    ice_turn_credential: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()

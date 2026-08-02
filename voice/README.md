# MockMatch voice agent (Pipecat)

Long-lived **Python workers** that run one Pipecat pipeline **task per conversation session** (not one Docker/GPU per user).

## Architecture

- **API** creates a session + short-lived ticket in Redis.
- Browser completes WebRTC signaling against this service (`POST /api/offer`).
- Pipeline: mic → STT → OpenRouter LLM → TTS → speaker.
- No GPU required for v1 (cloud STT/TTS/LLM).

## Local setup

```bash
# from monorepo root
npm run infra:up                    # Postgres + Redis (if not already up)
cd api && npm run db:migrate        # includes voice_sessions (0014)
cd ../voice
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -e .
cp .env.example .env                # fill keys (see below)
# Windows note: nltk is auto-unblocked via NLTK_DISABLE_IMPORT_SECURITY in app code
uvicorn app.main:app --reload --port 7860
```

From monorepo root: `npm run dev:voice` (after venv + install).

Run the voice regression tests with:

```bash
cd voice
python -P -m unittest discover -s tests -v
```

Also run API + client:

```bash
npm run dev:api
npm run dev:client
# separate terminal:
npm run dev:voice
```

Open a conversation simulation → setup dialog → start voice.

## Env

See `.env.example`. Sync with `api/.env`:

| Var | Must match API |
|-----|----------------|
| `JWT_ACCESS_SECRET` | same as API (voice tickets) |
| `VOICE_WORKER_SECRET` | same as API |
| `REDIS_URL` | same Redis |

Minimum for a live call:

- `OPENROUTER_API_KEY` — LLM (cheap/free model via `PIPECAT_LLM_MODEL`)
- `DEEPGRAM_API_KEY` — **STT + TTS** (one key for both)

Optional:

- `DEEPGRAM_STT_MODEL` — default `nova-3` (cheapest English streaming)

Without `DEEPGRAM_API_KEY`, `/ready` is `degraded` and `/api/offer` returns 503.

## Scaling

Workers **register in Redis** (`voice:workers` + heartbeat). API `createSession` picks the least-loaded worker and returns that worker’s `offerUrl` (sticky). Clients must POST WebRTC offers to **that** URL, not a random replica.

Configure **TURN** (`ICE_TURN_*` / API `VOICE_ICE_TURN_*`) for multi-network browsers; STUN alone is enough on LAN.

Do **not** spawn a container per interview for v1.

## Events + transcript

- Pipeline observer publishes Redis channel `voice:events:{sessionId}` (`agent_state`, `transcript`, `session_status`).
- API SSE: `GET /voice/sessions/:id/events` (cookie/JWT auth).
- Worker flushes transcript to `POST /voice/internal/transcript` (shared `VOICE_WORKER_SECRET`).

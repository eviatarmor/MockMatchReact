import { randomUUID } from "node:crypto"
import { getRedis } from "./redis.js"

const TICKET_PREFIX = "voice:ticket"
const SESSION_PREFIX = "voice:session"
const WORKERS_KEY = "voice:workers"

export interface VoiceTicketRecord {
  sessionId: string
  userId: string
  trackId: string
  sessionKind: string
  voiceId: string
  analyzeFace: boolean
  analyzePosture: boolean
  systemPrompt: string
  workerId?: string
  offerUrl?: string
}

export interface VoiceWorkerInfo {
  id: string
  publicUrl: string
  sessions: number
  ts: number
}

export async function storeVoiceTicket(
  jti: string,
  record: VoiceTicketRecord,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedis()
  await redis.set(
    `${TICKET_PREFIX}:${jti}`,
    JSON.stringify(record),
    "EX",
    ttlSeconds
  )
  await redis.set(
    `${SESSION_PREFIX}:${record.sessionId}`,
    JSON.stringify({ ...record, jti, status: "ready" }),
    "EX",
    Math.max(ttlSeconds, 60 * 60)
  )
}

export async function getVoiceSessionMeta(
  sessionId: string
): Promise<(VoiceTicketRecord & { jti?: string; status?: string }) | null> {
  const raw = await getRedis().get(`${SESSION_PREFIX}:${sessionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as VoiceTicketRecord & {
      jti?: string
      status?: string
    }
  } catch {
    return null
  }
}

export function newTicketJti(): string {
  return randomUUID()
}

/** Pick least-loaded live worker; null if registry empty. */
export async function pickVoiceWorker(): Promise<VoiceWorkerInfo | null> {
  const redis = getRedis()
  const all = await redis.hgetall(WORKERS_KEY)
  const now = Math.floor(Date.now() / 1000)
  const live: VoiceWorkerInfo[] = []

  for (const [id, raw] of Object.entries(all)) {
    try {
      const info = JSON.parse(raw) as VoiceWorkerInfo
      const alive = await redis.get(`voice:worker:${id}:alive`)
      if (!alive) {
        await redis.hdel(WORKERS_KEY, id)
        continue
      }
      // Stale heartbeats older than 45s
      if (typeof info.ts === "number" && now - info.ts > 45) {
        await redis.hdel(WORKERS_KEY, id)
        continue
      }
      if (info.publicUrl) {
        live.push({
          id: info.id || id,
          publicUrl: info.publicUrl.replace(/\/$/, ""),
          sessions: Number(info.sessions) || 0,
          ts: info.ts || now,
        })
      }
    } catch {
      await redis.hdel(WORKERS_KEY, id)
    }
  }

  if (live.length === 0) return null
  live.sort((a, b) => a.sessions - b.sessions)
  return live[0] ?? null
}

export function voiceEventsChannel(sessionId: string): string {
  return `voice:events:${sessionId}`
}

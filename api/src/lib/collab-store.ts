import type { CollabEffectiveRole, DocumentKind } from "@mockmatch/schemas"
import * as Y from "yjs"
import { env } from "../config/env.js"
import { getRedis } from "./redis.js"
import { setByPath } from "./path-op.js"

export const COLLAB_MAX_PEERS = 3
export const COLLAB_PALETTE = ["#3B82F6", "#EF4444", "#22C55E"] as const

const ROOM_TTL_SECONDS = 24 * 60 * 60
const PRESENCE_TTL_SECONDS = 45

export type CollabDocSnapshot = {
  rev: number
  ownerUserId: string
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
  updatedAt: string
  flushedRev: number
  /** Last user who applied a path op — used for version history attribution. */
  lastEditorUserId?: string
}

export type PresenceRecord = {
  userId: string
  name: string
  color: string
  role: CollabEffectiveRole
  /** Public account avatar URL when the user has a profile photo. */
  avatarUrl?: string | null
  lastSeen: number
  cursor?: {
    x: number
    y: number
    kind?: "pointer" | "caret" | "selection"
    h?: number
    rects?: Array<{ x: number; y: number; w: number; h: number }>
    path?: string
    sel?: {
      startLineNumber: number
      startColumn: number
      endLineNumber: number
      endColumn: number
    }
  }
}

function roomPrefix(kind: DocumentKind, id: string): string {
  return `collab:room:${kind}:${id}`
}

function docKey(kind: DocumentKind, id: string): string {
  return `${roomPrefix(kind, id)}:doc`
}

function presenceKey(kind: DocumentKind, id: string): string {
  return `${roomPrefix(kind, id)}:presence`
}

function membersKey(kind: DocumentKind, id: string): string {
  return `${roomPrefix(kind, id)}:members`
}

function dirtyKey(kind: DocumentKind, id: string): string {
  return `${roomPrefix(kind, id)}:dirty`
}

function yjsKey(kind: DocumentKind, id: string): string {
  return `${roomPrefix(kind, id)}:yjs`
}

export function channelName(kind: DocumentKind, id: string): string {
  return `collab:room:${kind}:${id}`
}

const COLLAB_Y_ROOT = "root"

function yToJson(value: unknown): unknown {
  if (value instanceof Y.Text) return value.toString()
  if (value instanceof Y.Array) return value.toArray().map((item) => yToJson(item))
  if (value instanceof Y.Map) {
    const out: Record<string, unknown> = {}
    value.forEach((v, k) => {
      out[k] = yToJson(v)
    })
    return out
  }
  return value
}

function jsonToY(value: unknown): unknown {
  if (value === null || value === undefined) return value ?? null
  if (typeof value === "boolean" || typeof value === "number") return value
  if (typeof value === "string") {
    const t = new Y.Text()
    if (value.length > 0) t.insert(0, value)
    return t
  }
  if (Array.isArray(value)) {
    const arr = new Y.Array()
    if (value.length > 0) {
      arr.insert(
        0,
        value.map((item) => jsonToY(item))
      )
    }
    return arr
  }
  if (typeof value === "object") {
    const map = new Y.Map()
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      map.set(k, jsonToY(v))
    }
    return map
  }
  return String(value)
}

function materializeYDoc(ydoc: Y.Doc): {
  title: string
  templateId: string
  style: Record<string, unknown>
  document: unknown
} {
  const root = ydoc.getMap(COLLAB_Y_ROOT)
  const styleRaw = yToJson(root.get("style"))
  return {
    title: String(root.get("title") ?? ""),
    templateId: String(root.get("templateId") ?? "modern"),
    style:
      styleRaw && typeof styleRaw === "object" && !Array.isArray(styleRaw)
        ? (styleRaw as Record<string, unknown>)
        : {},
    document: yToJson(root.get("document")) ?? {},
  }
}

async function loadYDoc(
  kind: DocumentKind,
  id: string
): Promise<Y.Doc> {
  const ydoc = new Y.Doc()
  const redis = getRedis()
  const buf = await redis.getBuffer(yjsKey(kind, id))
  if (buf && buf.length > 0) {
    Y.applyUpdate(ydoc, new Uint8Array(buf))
  }
  return ydoc
}

async function persistYDoc(
  kind: DocumentKind,
  id: string,
  ydoc: Y.Doc
): Promise<void> {
  const state = Y.encodeStateAsUpdate(ydoc)
  await getRedis().set(
    yjsKey(kind, id),
    Buffer.from(state),
    "EX",
    ROOM_TTL_SECONDS
  )
}

/** Ensure Yjs room state exists; seed from JSON snapshot when empty. */
export async function ensureYjsState(
  kind: DocumentKind,
  id: string,
  seed: {
    title: string
    templateId: string
    style: Record<string, unknown>
    document: unknown
  }
): Promise<Uint8Array> {
  const redis = getRedis()
  const existing = await redis.getBuffer(yjsKey(kind, id))
  if (existing && existing.length > 0) {
    return new Uint8Array(existing)
  }

  const ydoc = new Y.Doc()
  ydoc.transact(() => {
    const root = ydoc.getMap(COLLAB_Y_ROOT)
    root.set("title", seed.title)
    root.set("templateId", seed.templateId)
    root.set("style", jsonToY(seed.style ?? {}))
    root.set("document", jsonToY(seed.document ?? {}))
  })
  const state = Y.encodeStateAsUpdate(ydoc)
  await redis.set(yjsKey(kind, id), Buffer.from(state), "EX", ROOM_TTL_SECONDS)
  return state
}

/** Serialize concurrent Yjs applies per room (load→apply→persist is not atomic). */
const yjsApplyChains = new Map<string, Promise<unknown>>()

async function withYjsApplyLock<T>(
  kind: DocumentKind,
  id: string,
  fn: () => Promise<T>
): Promise<T> {
  const key = `${kind}:${id}`
  const prev = yjsApplyChains.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((r) => {
    release = r
  })
  const chained = prev.then(() => gate)
  yjsApplyChains.set(key, chained)
  await prev
  try {
    return await fn()
  } finally {
    release()
    if (yjsApplyChains.get(key) === chained) yjsApplyChains.delete(key)
  }
}

/**
 * Apply a client Yjs update, persist binary + JSON snapshot for Postgres flush.
 * Returns updated rev + full state encoding for late joiners (not sent every time).
 */
export async function applyYjsUpdate(
  kind: DocumentKind,
  id: string,
  update: Uint8Array,
  actorUserId?: string,
  /** When true (edit role), keep prior templateId/style — content only. */
  lockDesign = false
): Promise<CollabDocSnapshot | null> {
  return withYjsApplyLock(kind, id, async () => {
    const current = await getSnapshot(kind, id)
    if (!current) return null

    const ydoc = await loadYDoc(kind, id)
    // Empty ydoc (no prior binary) — seed from JSON first
    if (ydoc.getMap(COLLAB_Y_ROOT).size === 0) {
      ydoc.transact(() => {
        const root = ydoc.getMap(COLLAB_Y_ROOT)
        root.set("title", current.title)
        root.set("templateId", current.templateId)
        root.set("style", jsonToY(current.style ?? {}))
        root.set("document", jsonToY(current.document ?? {}))
      })
    }

    Y.applyUpdate(ydoc, update)

    if (lockDesign) {
      ydoc.transact(() => {
        const root = ydoc.getMap(COLLAB_Y_ROOT)
        root.set("templateId", current.templateId)
        root.set("style", jsonToY(current.style ?? {}))
      })
    }

    await persistYDoc(kind, id, ydoc)

    const mat = materializeYDoc(ydoc)
    const snapshot: CollabDocSnapshot = {
      ...current,
      rev: current.rev + 1,
      title: mat.title || current.title,
      templateId: lockDesign
        ? current.templateId
        : mat.templateId || current.templateId,
      style: lockDesign ? current.style : (mat.style ?? current.style),
      document: mat.document ?? current.document,
      updatedAt: new Date().toISOString(),
      lastEditorUserId: actorUserId ?? current.lastEditorUserId,
    }

    const redis = getRedis()
    await redis
      .pipeline()
      .set(docKey(kind, id), JSON.stringify(snapshot), "EX", ROOM_TTL_SECONDS)
      .set(dirtyKey(kind, id), "1", "EX", ROOM_TTL_SECONDS)
      .exec()

    return snapshot
  })
}

export function encodeYUpdateBase64(update: Uint8Array): string {
  return Buffer.from(update).toString("base64")
}

export function decodeYUpdateBase64(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"))
}

const CLAIM_SEAT_LUA = `
local members = KEYS[1]
local max = tonumber(ARGV[1])
local userId = ARGV[2]
if redis.call('SISMEMBER', members, userId) == 1 then
  return 1
end
if redis.call('SCARD', members) >= max then
  return 0
end
redis.call('SADD', members, userId)
return 1
`

export async function claimSeat(
  kind: DocumentKind,
  id: string,
  userId: string
): Promise<boolean> {
  const redis = getRedis()
  const key = membersKey(kind, id)
  const result = await redis.eval(
    CLAIM_SEAT_LUA,
    1,
    key,
    String(COLLAB_MAX_PEERS),
    userId
  )
  await redis.expire(key, ROOM_TTL_SECONDS)
  return result === 1
}

export async function releaseSeat(
  kind: DocumentKind,
  id: string,
  userId: string
): Promise<number> {
  const redis = getRedis()
  await redis.srem(membersKey(kind, id), userId)
  await redis.hdel(presenceKey(kind, id), userId)
  return redis.scard(membersKey(kind, id))
}

export async function memberCount(
  kind: DocumentKind,
  id: string
): Promise<number> {
  return getRedis().scard(membersKey(kind, id))
}

/** True when user currently holds a seat in the live room. */
export async function isMember(
  kind: DocumentKind,
  id: string,
  userId: string
): Promise<boolean> {
  const n = await getRedis().sismember(membersKey(kind, id), userId)
  return n === 1
}

export async function getSnapshot(
  kind: DocumentKind,
  id: string
): Promise<CollabDocSnapshot | null> {
  const raw = await getRedis().get(docKey(kind, id))
  if (!raw) return null
  try {
    return JSON.parse(raw) as CollabDocSnapshot
  } catch {
    return null
  }
}

export async function setSnapshot(
  kind: DocumentKind,
  id: string,
  snapshot: CollabDocSnapshot
): Promise<void> {
  const redis = getRedis()
  await redis.set(
    docKey(kind, id),
    JSON.stringify(snapshot),
    "EX",
    ROOM_TTL_SECONDS
  )
}

export async function seedSnapshotIfMissing(
  kind: DocumentKind,
  id: string,
  seed: Omit<CollabDocSnapshot, "rev" | "flushedRev"> & {
    rev?: number
    flushedRev?: number
  }
): Promise<CollabDocSnapshot> {
  const existing = await getSnapshot(kind, id)
  if (existing) return existing
  const snapshot: CollabDocSnapshot = {
    rev: seed.rev ?? 0,
    flushedRev: seed.flushedRev ?? seed.rev ?? 0,
    ownerUserId: seed.ownerUserId,
    title: seed.title,
    templateId: seed.templateId,
    style: seed.style,
    document: seed.document,
    updatedAt: seed.updatedAt,
  }
  await setSnapshot(kind, id, snapshot)
  return snapshot
}

export async function applyPathOp(
  kind: DocumentKind,
  id: string,
  path: string,
  value: unknown,
  actorUserId?: string
): Promise<CollabDocSnapshot | null> {
  const current = await getSnapshot(kind, id)
  if (!current) return null

  const root: Record<string, unknown> = {
    title: current.title,
    templateId: current.templateId,
    style: current.style,
    document: current.document,
  }
  const next = setByPath(root, path, value)
  const snapshot: CollabDocSnapshot = {
    ...current,
    rev: current.rev + 1,
    title: String(next.title ?? current.title),
    templateId: String(next.templateId ?? current.templateId),
    style: (next.style as Record<string, unknown>) ?? current.style,
    document: next.document ?? current.document,
    updatedAt: new Date().toISOString(),
    lastEditorUserId: actorUserId ?? current.lastEditorUserId,
  }
  // Pipeline write + dirty flag — one round-trip (lower collab latency)
  const redis = getRedis()
  await redis
    .pipeline()
    .set(docKey(kind, id), JSON.stringify(snapshot), "EX", ROOM_TTL_SECONDS)
    .set(dirtyKey(kind, id), "1", "EX", ROOM_TTL_SECONDS)
    .exec()
  return snapshot
}

export async function markDirty(
  kind: DocumentKind,
  id: string
): Promise<void> {
  await getRedis().set(dirtyKey(kind, id), "1", "EX", ROOM_TTL_SECONDS)
}

export async function clearDirty(
  kind: DocumentKind,
  id: string
): Promise<void> {
  await getRedis().del(dirtyKey(kind, id))
}

export async function isDirty(kind: DocumentKind, id: string): Promise<boolean> {
  const v = await getRedis().get(dirtyKey(kind, id))
  return v === "1"
}

export async function markFlushed(
  kind: DocumentKind,
  id: string,
  rev: number
): Promise<void> {
  const snap = await getSnapshot(kind, id)
  if (!snap) return
  if (snap.rev !== rev) {
    // Newer ops arrived during flush — keep dirty
    return
  }
  snap.flushedRev = rev
  await setSnapshot(kind, id, snap)
  await clearDirty(kind, id)
}

export async function setPresence(
  kind: DocumentKind,
  id: string,
  record: PresenceRecord
): Promise<void> {
  const redis = getRedis()
  const key = presenceKey(kind, id)
  await redis.hset(key, record.userId, JSON.stringify(record))
  await redis.expire(key, ROOM_TTL_SECONDS)
}

export async function getAllPresence(
  kind: DocumentKind,
  id: string
): Promise<PresenceRecord[]> {
  const raw = await getRedis().hgetall(presenceKey(kind, id))
  const now = Date.now()
  const out: PresenceRecord[] = []
  for (const value of Object.values(raw)) {
    try {
      const p = JSON.parse(value) as PresenceRecord
      if (now - p.lastSeen > PRESENCE_TTL_SECONDS * 1000) continue
      out.push(p)
    } catch {
      // skip bad
    }
  }
  return out
}

/** Assign color from palette by current members (stable for rejoins if still present). */
export async function assignColor(
  kind: DocumentKind,
  id: string,
  userId: string
): Promise<string> {
  const peers = await getAllPresence(kind, id)
  const existing = peers.find((p) => p.userId === userId)
  if (existing) return existing.color

  const used = new Set(peers.map((p) => p.color))
  for (const c of COLLAB_PALETTE) {
    if (!used.has(c)) return c
  }
  return COLLAB_PALETTE[peers.length % COLLAB_PALETTE.length]!
}

export async function publishRoom(
  kind: DocumentKind,
  id: string,
  message: unknown
): Promise<void> {
  await getRedis().publish(channelName(kind, id), JSON.stringify(message))
}

export function flushJobId(kind: DocumentKind, id: string): string {
  return `flush:${kind}:${id}`
}

export function collabFlushDelayMs(): number {
  return env.COLLAB_FLUSH_DELAY_MS
}

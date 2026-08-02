import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import type { CollabEffectiveRole, DocumentKind } from "@mockmatch/schemas"
import { env } from "../config/env.js"

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

const ACCESS_TTL = "15m"
/** Short-lived access JWT for headless print/PDF capture. */
const PRINT_ACCESS_TTL = "2m"
/** Short-lived WS collab ticket (not an access cookie). */
const COLLAB_TICKET_TTL = "2m"
/** Short-lived voice WebRTC ticket (Pipecat worker validates + Redis). */
const VOICE_TICKET_TTL = "10m"
const REFRESH_TTL = "30d"

export interface AccessTokenPayload extends JWTPayload {
  sub: string
  email: string
  type: "access"
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string
  type: "refresh"
}

export async function signAccessToken(input: {
  userId: string
  email: string
  /** Override default 15m access TTL (e.g. short-lived print capture). */
  expiresIn?: string
}): Promise<string> {
  return new SignJWT({ email: input.email, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(input.expiresIn ?? ACCESS_TTL)
    .sign(accessSecret)
}

/** Mint a short-lived access JWT for Playwright print/PDF capture. */
export async function signPrintAccessToken(input: {
  userId: string
  email: string
}): Promise<string> {
  return signAccessToken({ ...input, expiresIn: PRINT_ACCESS_TTL })
}

export async function signRefreshToken(input: {
  userId: string
}): Promise<string> {
  return new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(refreshSecret)
}

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret)
  if (payload.type !== "access" || typeof payload.sub !== "string") {
    throw new Error("Invalid access token")
  }
  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret)
  if (payload.type !== "refresh" || typeof payload.sub !== "string") {
    throw new Error("Invalid refresh token")
  }
  return payload as RefreshTokenPayload
}

export interface CollabTicketPayload extends JWTPayload {
  sub: string
  email: string
  name: string
  type: "collab"
  kind: DocumentKind
  documentId: string
  role: CollabEffectiveRole
  ownerUserId: string
  aud: "collab"
}

export async function signCollabTicket(input: {
  sub: string
  email: string
  name: string
  kind: DocumentKind
  documentId: string
  role: CollabEffectiveRole
  ownerUserId: string
}): Promise<string> {
  return new SignJWT({
    email: input.email,
    name: input.name,
    type: "collab",
    kind: input.kind,
    documentId: input.documentId,
    role: input.role,
    ownerUserId: input.ownerUserId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setAudience("collab")
    .setIssuedAt()
    .setExpirationTime(COLLAB_TICKET_TTL)
    .sign(accessSecret)
}

export interface VoiceTicketPayload extends JWTPayload {
  sub: string
  type: "voice_ticket"
  sid: string
  jti: string
  aud: "voice"
}

export async function signVoiceTicket(input: {
  userId: string
  sessionId: string
  jti: string
}): Promise<string> {
  return new SignJWT({
    type: "voice_ticket",
    sid: input.sessionId,
    jti: input.jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setAudience("voice")
    .setJti(input.jti)
    .setIssuedAt()
    .setExpirationTime(VOICE_TICKET_TTL)
    .sign(accessSecret)
}

export async function verifyCollabTicket(
  token: string
): Promise<CollabTicketPayload> {
  const { payload } = await jwtVerify(token, accessSecret, {
    audience: "collab",
  })
  if (
    payload.type !== "collab" ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.kind !== "string" ||
    typeof payload.documentId !== "string" ||
    typeof payload.role !== "string" ||
    typeof payload.ownerUserId !== "string"
  ) {
    throw new Error("Invalid collab ticket")
  }
  return payload as CollabTicketPayload
}

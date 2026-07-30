/**
 * Short-lived sandbox capability tickets (not access/refresh JWTs).
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import type { CollabEffectiveRole } from "@mockmatch/schemas"
import { env } from "../../config/env.js"
import type { SandboxScope } from "./types.js"

const secret = () =>
  new TextEncoder().encode(
    env.SANDBOX_TICKET_SECRET || env.JWT_ACCESS_SECRET
  )

const TTL = () => `${env.SANDBOX_TICKET_TTL_SECONDS}s`

export type SandboxTicketPayload = JWTPayload & {
  sub: string
  type: "sandbox"
  sid: string
  kind: "workspace"
  role: CollabEffectiveRole
  scp: SandboxScope[]
}

export async function signSandboxTicket(input: {
  userId: string
  sessionId: string
  role: CollabEffectiveRole
  scopes?: SandboxScope[]
}): Promise<string> {
  const scp: SandboxScope[] =
    input.scopes ??
    (input.role === "view" ? [] : (["run", "pty"] as SandboxScope[]))
  return new SignJWT({
    type: "sandbox",
    sid: input.sessionId,
    kind: "workspace",
    role: input.role,
    scp,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(TTL())
    .sign(secret())
}

export async function verifySandboxTicket(
  token: string
): Promise<SandboxTicketPayload> {
  const { payload } = await jwtVerify(token, secret())
  if (
    payload.type !== "sandbox" ||
    typeof payload.sub !== "string" ||
    typeof payload.sid !== "string" ||
    !Array.isArray(payload.scp)
  ) {
    throw new Error("Invalid sandbox ticket")
  }
  return payload as SandboxTicketPayload
}

export function ticketHasScope(
  ticket: SandboxTicketPayload,
  scope: SandboxScope
): boolean {
  return ticket.scp.includes(scope)
}

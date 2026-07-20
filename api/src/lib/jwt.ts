import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { env } from "../config/env.js"

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET)
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

const ACCESS_TTL = "15m"
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
}): Promise<string> {
  return new SignJWT({ email: input.email, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecret)
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

/**
 * Auth ephemeral state (OTP challenges, refresh token hashes) lives in Redis
 * so any API replica can serve login/refresh without sticky sessions.
 *
 * Durable identity remains in Postgres: `users`, `oauth_accounts`.
 *
 * Tables `otp_challenges` / `refresh_tokens` were removed; see migration 0001.
 */

export {}

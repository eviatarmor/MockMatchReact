import { Hono } from "hono"
import { env } from "../../config/env.js"

/**
 * OAuth browser redirects stay on plain Hono (not tRPC).
 * LinkedIn secrets come from env / GCP SM in prod.
 * Handlers still stubs — upsert users + oauth_accounts + issueTokens next.
 *
 * Register LinkedIn redirect URI exactly as LINKEDIN_REDIRECT_URI
 * (prod: https://<domain>/auth/oauth/linkedin/callback).
 */
export const oauthRoutes = new Hono()

oauthRoutes.get("/:provider", (c) => {
  const provider = c.req.param("provider")
  if (provider === "linkedin" && !env.LINKEDIN_CLIENT_ID) {
    return c.json(
      {
        error: "NOT_CONFIGURED",
        message:
          "LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET.",
      },
      503
    )
  }
  return c.json(
    {
      error: "NOT_IMPLEMENTED",
      message: `OAuth start for provider "${provider}" not implemented yet`,
      redirectUri:
        provider === "linkedin"
          ? env.LINKEDIN_REDIRECT_URI ||
            `${env.API_URL}/auth/oauth/linkedin/callback`
          : undefined,
    },
    501
  )
})

oauthRoutes.get("/:provider/callback", (c) => {
  const provider = c.req.param("provider")
  return c.json(
    {
      error: "NOT_IMPLEMENTED",
      message: `OAuth callback for provider "${provider}" not implemented yet`,
    },
    501
  )
})

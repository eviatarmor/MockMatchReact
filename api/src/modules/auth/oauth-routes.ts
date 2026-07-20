import { Hono } from "hono"

/**
 * OAuth browser redirects stay on plain Hono (not tRPC).
 * Stubs only — wire Google/LinkedIn provider apps later.
 */
export const oauthRoutes = new Hono()

oauthRoutes.get("/:provider", (c) => {
  const provider = c.req.param("provider")
  return c.json(
    {
      error: "NOT_IMPLEMENTED",
      message: `OAuth start for provider "${provider}" not implemented yet`,
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

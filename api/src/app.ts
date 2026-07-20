import { Hono } from "hono"
import { cors } from "hono/cors"
import { trpcServer } from "@hono/trpc-server"
import { env } from "./config/env.js"
import { healthRoutes } from "./modules/health/routes.js"
import { oauthRoutes } from "./modules/auth/oauth-routes.js"
import { createContext } from "./trpc/context.js"
import { appRouter } from "./trpc/router.js"

export function createApp() {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: env.APP_URL,
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  )

  app.route("/", healthRoutes)
  app.route("/auth/oauth", oauthRoutes)

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      // @hono/trpc-server types context as Record<string, unknown>
      createContext: async (opts, c) => createContext(opts, c),
    })
  )

  return app
}

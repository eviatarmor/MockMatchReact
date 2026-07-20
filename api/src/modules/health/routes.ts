import { Hono } from "hono"

export const healthRoutes = new Hono()

healthRoutes.get("/health", (c) =>
  c.json({ status: "ok", service: "mockmatch-api" })
)

healthRoutes.get("/ready", (c) =>
  c.json({ status: "ready", service: "mockmatch-api" })
)

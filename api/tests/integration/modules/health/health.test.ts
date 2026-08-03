import { expect, it } from "vitest"
import {
  createTestApp,
  describeIntegration,
} from "../../../helpers/integration.js"

describeIntegration("health routes (integration)", () => {
  const app = createTestApp()

  it("GET /health is live without deps", async () => {
    const res = await app.request("/health")
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string; service: string }
    expect(body.status).toBe("ok")
    expect(body.service).toBe("mockmatch-api")
  })

  it("GET /ready reports postgres + redis", async () => {
    const res = await app.request("/ready")
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      status: string
      checks: { postgres: string; redis: string }
    }
    expect(body.status).toBe("ready")
    expect(body.checks.postgres).toBe("ok")
    expect(body.checks.redis).toBe("ok")
  })
})

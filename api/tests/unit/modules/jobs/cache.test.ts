import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { buildJobsCacheKey } from "@/modules/jobs/cache.js"

describe("buildJobsCacheKey", () => {
  it("prefixes provider and uses stable sorted payload hash", () => {
    const key = buildJobsCacheKey("adzuna", { q: "react", page: 1, country: "us" })
    expect(key.startsWith("jobs:search:v1:adzuna:")).toBe(true)
    const hash = key.split(":").pop()!
    expect(hash).toMatch(/^[a-f0-9]{32}$/)
  })

  it("is order-independent for object keys", () => {
    const a = buildJobsCacheKey("adzuna", { b: 2, a: 1 })
    const b = buildJobsCacheKey("adzuna", { a: 1, b: 2 })
    expect(a).toBe(b)
  })

  it("differs for different providers or payloads", () => {
    const base = { q: "go" }
    expect(buildJobsCacheKey("adzuna", base)).not.toBe(
      buildJobsCacheKey("other", base)
    )
    expect(buildJobsCacheKey("adzuna", { q: "go" })).not.toBe(
      buildJobsCacheKey("adzuna", { q: "rust" })
    )
  })

  it("matches manual sha256 slice", () => {
    const payload = { page: 2, q: "node" }
    const json = JSON.stringify(payload, Object.keys(payload).sort())
    const hash = createHash("sha256").update(json).digest("hex").slice(0, 32)
    expect(buildJobsCacheKey("adzuna", payload)).toBe(
      `jobs:search:v1:adzuna:${hash}`
    )
  })
})

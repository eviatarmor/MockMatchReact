import { describe, expect, it } from "vitest"
import { ASK_PRODUCT_GUIDE } from "@/modules/ask/product-guide.js"

describe("ASK_PRODUCT_GUIDE", () => {
  it("identifies MockMatch Ask and core product areas", () => {
    expect(ASK_PRODUCT_GUIDE).toContain("MockMatch Ask")
    expect(ASK_PRODUCT_GUIDE).toContain("Resume Lab")
    expect(ASK_PRODUCT_GUIDE).toContain("Discover")
    expect(ASK_PRODUCT_GUIDE).toContain("Question Bank")
  })

  it("documents main app routes used in nav", () => {
    const routes = [
      "/resume-lab",
      "/cover-letters",
      "/discover",
      "/applications",
      "/simulations",
      "/question-bank",
      "/readiness",
      "/performance",
      "/autofill",
      "/help",
      "/notifications",
    ]
    for (const route of routes) {
      expect(ASK_PRODUCT_GUIDE).toContain(route)
    }
  })

  it("includes how-to guidance and honesty constraints", () => {
    expect(ASK_PRODUCT_GUIDE).toMatch(/How-tos/i)
    expect(ASK_PRODUCT_GUIDE).toMatch(/do not invent/i)
  })

  it("does not document Custom questions authoring", () => {
    expect(ASK_PRODUCT_GUIDE).not.toContain("/custom-questions")
    expect(ASK_PRODUCT_GUIDE).not.toMatch(/questions\.createCustom/)
    expect(ASK_PRODUCT_GUIDE).not.toMatch(/questions\.deploy/)
    expect(ASK_PRODUCT_GUIDE).not.toMatch(/questions\.listMine/)
    expect(ASK_PRODUCT_GUIDE).not.toMatch(/questions\.simulationTypes/)
  })
})

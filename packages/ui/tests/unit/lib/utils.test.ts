import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("tailwind-merge: later conflicting class wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
  })

  it("drops falsy conditionals", () => {
    expect(cn("base", false && "hidden", "ok")).toBe("base ok")
  })
})

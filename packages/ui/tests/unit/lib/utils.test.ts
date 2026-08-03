import { describe, expect, it } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toContain("px-2")
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles conditionals", () => {
    expect(cn("base", false && "hidden", "ok")).toContain("ok")
    expect(cn("base", false && "hidden")).not.toContain("hidden")
  })

  it("handles arrays and undefined", () => {
    expect(cn(["a", "b"], undefined, null, "c")).toContain("a")
    expect(cn(["a", "b"], undefined, null, "c")).toContain("c")
  })

  it("tailwind conflict resolution last wins", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
    expect(cn("p-2", "p-4", "px-1")).toContain("px-1")
  })
})

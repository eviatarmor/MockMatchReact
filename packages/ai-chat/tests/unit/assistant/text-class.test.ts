import { describe, expect, it } from "vitest"
import {
  ASSISTANT_USER_TEXT_CLASS,
  assistantTextClass,
} from "@/assistant/text-class"

describe("assistantTextClass", () => {
  it("sidebar uses sidebar tokens", () => {
    const c = assistantTextClass("sidebar")
    expect(c).toContain("text-[15px]")
    expect(c).toContain("text-sidebar-foreground")
    expect(c).toContain("sidebar-border")
    expect(c).not.toContain("text-muted-foreground")
  })

  it("surface uses foreground / muted tokens", () => {
    const c = assistantTextClass("surface")
    expect(c).toContain("text-[15px]")
    expect(c).toContain("text-foreground")
    expect(c).toContain("text-muted-foreground")
    expect(c).not.toContain("sidebar-foreground")
  })

  it("both share body size and list/table rules", () => {
    const side = assistantTextClass("sidebar")
    const surf = assistantTextClass("surface")
    for (const c of [side, surf]) {
      expect(c).toContain("text-[15px]")
      expect(c).toContain("list-decimal")
      expect(c).toContain("list-disc")
      expect(c).toContain("[&_table]")
      expect(c).toContain("[&_code]")
    }
  })
})

describe("ASSISTANT_USER_TEXT_CLASS", () => {
  it("matches body size + pre-wrap", () => {
    expect(ASSISTANT_USER_TEXT_CLASS).toContain("text-[15px]")
    expect(ASSISTANT_USER_TEXT_CLASS).toContain("whitespace-pre-wrap")
  })
})

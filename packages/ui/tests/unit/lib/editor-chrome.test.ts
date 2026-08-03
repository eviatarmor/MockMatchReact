import { describe, expect, it } from "vitest"
import {
  EDITOR_SECONDARY_BAR_ROW,
  EDITOR_SECONDARY_BAR_SURFACE,
  EDITOR_SECONDARY_BAR_SURFACE_STUCK,
} from "@/lib/editor-chrome"

describe("editor chrome tokens", () => {
  it("surface is solid secondary bar", () => {
    expect(EDITOR_SECONDARY_BAR_SURFACE).toContain("border-b")
    expect(EDITOR_SECONDARY_BAR_SURFACE).toContain("bg-neutral-50")
    expect(EDITOR_SECONDARY_BAR_SURFACE).not.toContain("backdrop-blur")
  })

  it("stuck surface adds glass blur", () => {
    expect(EDITOR_SECONDARY_BAR_SURFACE_STUCK).toContain("backdrop-blur")
    expect(EDITOR_SECONDARY_BAR_SURFACE_STUCK).toContain("bg-neutral-50/75")
  })

  it("row metrics match h-11 flex row", () => {
    expect(EDITOR_SECONDARY_BAR_ROW).toContain("h-11")
    expect(EDITOR_SECONDARY_BAR_ROW).toContain("flex")
    expect(EDITOR_SECONDARY_BAR_ROW).toContain("items-center")
  })
})

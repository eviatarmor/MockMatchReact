import { describe, expect, it } from "vitest"
import { canApplyPath, permissionsForRole } from "@/modules/collab/permissions.js"

describe("permissionsForRole", () => {
  it("gives owner full capabilities", () => {
    expect(permissionsForRole("owner")).toEqual({
      canEditContent: true,
      canEditDesign: true,
      canUseAi: true,
      canShare: true,
      canExport: true,
    })
  })

  it("gives edit content-only capabilities", () => {
    expect(permissionsForRole("edit")).toEqual({
      canEditContent: true,
      canEditDesign: false,
      canUseAi: false,
      canShare: false,
      canExport: false,
    })
  })

  it("gives view no write capabilities", () => {
    expect(permissionsForRole("view")).toEqual({
      canEditContent: false,
      canEditDesign: false,
      canUseAi: false,
      canShare: false,
      canExport: false,
    })
  })
})

describe("canApplyPath", () => {
  it("denies all paths for view", () => {
    expect(canApplyPath("view", "title")).toBe(false)
    expect(canApplyPath("view", "document.header.name")).toBe(false)
    expect(canApplyPath("view", "style.accent")).toBe(false)
  })

  it("allows all paths for owner", () => {
    expect(canApplyPath("owner", "title")).toBe(true)
    expect(canApplyPath("owner", "document.sections.0")).toBe(true)
    expect(canApplyPath("owner", "style.accent")).toBe(true)
    expect(canApplyPath("owner", "templateId")).toBe(true)
    expect(canApplyPath("owner", "status")).toBe(true)
  })

  it("allows edit content and title only", () => {
    expect(canApplyPath("edit", "title")).toBe(true)
    expect(canApplyPath("edit", "document")).toBe(true)
    expect(canApplyPath("edit", "document.header.name")).toBe(true)
    expect(canApplyPath("edit", "document.sections.0.text")).toBe(true)
  })

  it("denies edit design and metadata paths", () => {
    expect(canApplyPath("edit", "templateId")).toBe(false)
    expect(canApplyPath("edit", "style")).toBe(false)
    expect(canApplyPath("edit", "style.accent")).toBe(false)
    expect(canApplyPath("edit", "status")).toBe(false)
    expect(canApplyPath("edit", "targetRole")).toBe(false)
    expect(canApplyPath("edit", "company")).toBe(false)
    expect(canApplyPath("edit", "unknown.path")).toBe(false)
  })
})

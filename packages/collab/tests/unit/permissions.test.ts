import { describe, expect, it } from "vitest"
import { permissionsForRole } from "@/permissions"

describe("permissionsForRole", () => {
  it("owner has full access", () => {
    expect(permissionsForRole("owner")).toEqual({
      canEditContent: true,
      canEditDesign: true,
      canUseAi: true,
      canShare: true,
      canExport: true,
    })
  })

  it("edit can change content only", () => {
    expect(permissionsForRole("edit")).toEqual({
      canEditContent: true,
      canEditDesign: false,
      canUseAi: false,
      canShare: false,
      canExport: false,
    })
  })

  it("view is read-only", () => {
    expect(permissionsForRole("view")).toEqual({
      canEditContent: false,
      canEditDesign: false,
      canUseAi: false,
      canShare: false,
      canExport: false,
    })
  })

  it("owner vs edit differ on design/ai/share/export", () => {
    const owner = permissionsForRole("owner")
    const edit = permissionsForRole("edit")
    expect(owner.canEditContent).toBe(edit.canEditContent)
    expect(owner.canEditDesign).not.toBe(edit.canEditDesign)
    expect(owner.canUseAi).not.toBe(edit.canUseAi)
    expect(owner.canShare).not.toBe(edit.canShare)
    expect(owner.canExport).not.toBe(edit.canExport)
  })
})

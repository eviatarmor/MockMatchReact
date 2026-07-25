import type {
  CollabEffectiveRole,
  CollabPermissions,
} from "@mockmatch/schemas"

/** Map effective role → capability flags (client UI + server op allowlist). */
export function permissionsForRole(
  role: CollabEffectiveRole
): CollabPermissions {
  switch (role) {
    case "owner":
      return {
        canEditContent: true,
        canEditDesign: true,
        canUseAi: true,
        canShare: true,
        canExport: true,
      }
    case "edit":
      return {
        canEditContent: true,
        canEditDesign: false,
        canUseAi: false,
        canShare: false,
        canExport: false,
      }
    case "view":
      return {
        canEditContent: false,
        canEditDesign: false,
        canUseAi: false,
        canShare: false,
        canExport: false,
      }
  }
}

/**
 * Server-side path allowlist for LWW ops.
 * Paths use root keys: title | templateId | style | style.* | document | document.*
 */
export function canApplyPath(
  role: CollabEffectiveRole,
  path: string
): boolean {
  if (role === "view") return false
  if (role === "owner") return true

  // edit: content + title only — never design axes
  if (path === "title") return true
  if (path === "document" || path.startsWith("document.")) return true
  if (path === "templateId") return false
  if (path === "style" || path.startsWith("style.")) return false
  if (path === "status" || path === "targetRole" || path === "company") {
    return false
  }
  return false
}

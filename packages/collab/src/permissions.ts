import type { CollabEffectiveRole, CollabPermissions } from "@mockmatch/schemas"

export function permissionsForRole(role: CollabEffectiveRole): CollabPermissions {
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

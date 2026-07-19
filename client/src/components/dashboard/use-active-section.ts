import { useLocation } from "react-router-dom"
import { NAV_SECTIONS } from "@/components/dashboard/constants"
import type { NavSection } from "@/components/dashboard/types"

// Resolves the nav section that owns the current route. Falls back to the first
// section so the label column always has content to render.
export function useActiveSection(): NavSection {
  const { pathname } = useLocation()
  const match = NAV_SECTIONS.find((section) =>
    section.items.some((item) => item.href && pathname.startsWith(item.href))
  )
  return match ?? NAV_SECTIONS[0]
}

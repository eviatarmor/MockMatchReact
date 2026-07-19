import type { LucideIcon } from "lucide-react"

export interface NavItem {
  readonly label?: string
  readonly isSection?: boolean
  readonly title?: string
  readonly icon?: LucideIcon
  readonly href?: string
}

export interface NavSection {
  readonly id: string
  readonly labelKey: string
  readonly icon: LucideIcon
  readonly items: NavItem[]
}

export interface DashboardUser {
  readonly name: string
  readonly email: string
  readonly avatarUrl?: string
}

export interface UserMenuAction {
  readonly labelKey: string
  readonly icon: LucideIcon
  readonly destructive?: boolean
}

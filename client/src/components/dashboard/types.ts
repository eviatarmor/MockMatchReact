import type { LucideIcon } from "lucide-react"

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

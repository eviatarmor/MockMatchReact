import type { LucideIcon } from "lucide-react"

export interface PrepTask {
  readonly id: string
  readonly labelKey: string
  readonly completed: boolean
  readonly actionLabelKey?: string
  readonly actionIcon?: LucideIcon
}

export interface PrepStep {
  readonly id: string
  readonly icon: LucideIcon
  readonly titleKey: string
  readonly descriptionKey: string
  readonly footerActionLabelKey: string
  readonly footerActionIcon: LucideIcon
  readonly tasks: PrepTask[]
}

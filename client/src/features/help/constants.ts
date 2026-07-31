import {
  Bug,
  CreditCard,
  Info,
  Lightbulb,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import type { HelpTopic } from "@/features/help/types"

export type HelpTopicOption = {
  readonly id: HelpTopic
  readonly labelKey: string
  readonly descriptionKey: string
  readonly icon: LucideIcon
}

export const HELP_TOPIC_OPTIONS: readonly HelpTopicOption[] = [
  {
    id: "billing",
    labelKey: "topics.billing.label",
    descriptionKey: "topics.billing.description",
    icon: CreditCard,
  },
  {
    id: "bug",
    labelKey: "topics.bug.label",
    descriptionKey: "topics.bug.description",
    icon: Bug,
  },
  {
    id: "account",
    labelKey: "topics.account.label",
    descriptionKey: "topics.account.description",
    icon: UserRound,
  },
  {
    id: "feature",
    labelKey: "topics.feature.label",
    descriptionKey: "topics.feature.description",
    icon: Lightbulb,
  },
  {
    id: "info",
    labelKey: "topics.info.label",
    descriptionKey: "topics.info.description",
    icon: Info,
  },
] as const

export const DEFAULT_HELP_TOPIC: HelpTopic = "info"

export const MIN_HELP_MESSAGE_LENGTH = 10
export const MAX_HELP_MESSAGE_LENGTH = 4000
export const MAX_HELP_SUBJECT_LENGTH = 120

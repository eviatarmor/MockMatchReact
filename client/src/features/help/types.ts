import type { HelpTopic } from "@mockmatch/schemas"

export type { HelpTopic }

export type HelpFormValues = {
  topic: HelpTopic
  subject: string
  message: string
}

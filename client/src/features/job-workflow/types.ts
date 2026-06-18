export type MomentSentiment = "positive" | "caution"

export interface RecorderStat {
  readonly id: string
  readonly value: string
  readonly subValue: string
  readonly labelKey: string
  readonly iconName: string
}

export interface KeyMoment {
  readonly id: string
  readonly timestamp: string
  readonly text: string
  readonly sentiment: MomentSentiment
}

export interface RecordedInterview {
  readonly id: string
  readonly date: string
  readonly company: string
  readonly role: string
  readonly platform: string
  readonly durationMin: number
  readonly talkRatio: number
  readonly insightCount: number
  readonly status: "analyzed" | "processing" | "draft"
}

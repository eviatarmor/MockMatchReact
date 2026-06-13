export interface FeatureHighlight {
  id: string
  labelKey: string
  icon: "resume" | "interview" | "readiness"
}

export interface ReadinessUpdate {
  id: string
  score: number
  messageKey: string
}

export interface ReadinessSummary {
  maxScore: number
  updates: readonly [ReadinessUpdate, ...ReadinessUpdate[]]
}

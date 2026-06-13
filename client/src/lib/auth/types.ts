export type SocialProvider = "google" | "linkedin"

export interface LoginCredentials {
  email: string
  password: string
}

export interface FeatureHighlight {
  id: string
  label: string
  icon: "resume" | "interview" | "readiness"
}

export interface ReadinessUpdate {
  score: number
  message: string
}

export interface ReadinessSummary {
  maxScore: number
  updates: readonly [ReadinessUpdate, ...ReadinessUpdate[]]
}

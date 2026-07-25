export interface ResumeItem {
  readonly id: string
  readonly title: string
  readonly targetRole: string | null
  readonly company: string | null
  /** Job-agnostic resume health (0–100). Null until scored. */
  readonly generalScore: number | null
  readonly status: "active" | "draft" | "archived"
  readonly updatedAt: string
  readonly avatarText: string
}

export type ResumeTemplateCategory =
  | "tech"
  | "healthcare"
  | "finance"
  | "consulting"
  | "engineering"
  | "legal"

export interface ResumeTemplate {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly category: ResumeTemplateCategory
  readonly description: string
  readonly avatarText: string
  readonly country?: "US" | "UK" | "AU"
}

export interface ResumeItem {
  readonly id: string
  readonly title: string
  readonly targetRole: string | null
  readonly company: string | null
  readonly atsScore: number | null
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

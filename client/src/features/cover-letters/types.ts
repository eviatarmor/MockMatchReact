export interface CoverLetterItem {
  readonly id: string
  readonly title: string
  readonly company: string | null
  readonly status: "active" | "draft" | "archived"
  readonly updatedAt: string
  readonly avatarText: string
}

export type CoverLetterTemplateCategory =
  | "tech"
  | "healthcare"
  | "finance"
  | "consulting"
  | "engineering"
  | "legal"

export interface CoverLetterTemplate {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly category: CoverLetterTemplateCategory
  readonly description: string
  readonly avatarText: string
}

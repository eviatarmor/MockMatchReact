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

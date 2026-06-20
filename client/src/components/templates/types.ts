// Shape consumed by the shared template browser. Feature template types
// (ResumeTemplate, CoverLetterTemplate, ...) are structurally compatible.
export interface TemplateItem {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly description: string
  readonly avatarText: string
  readonly category: string
}

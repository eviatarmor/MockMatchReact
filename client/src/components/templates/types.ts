// Shape consumed by the shared template browser. Feature template types
// (ResumeTemplate, CoverLetterTemplate, ...) are structurally compatible.
export interface TemplateItem {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly description: string
  readonly avatarText: string
  /** theSVG brand mark path when available; otherwise UI uses avatarText. */
  readonly logoUrl?: string
  readonly category: string
  /** Target market flag for big-employer templates (US / UK / AU). */
  readonly country?: "US" | "UK" | "AU"
}

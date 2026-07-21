import type { DocumentStyleDto } from "@mockmatch/schemas"
import type { CoverLetterDocument } from "@/features/cover-letter-editor/types"
import type { EditorTemplateId as LetterLayoutId } from "@/features/cover-letter-editor/types"
import type { EditorTemplateId as ResumeLayoutId, ResumeDocument } from "@/features/resume-editor/types"

export type TemplateCountry = "US" | "UK" | "AU"

export type RoleTemplateCategory =
  | "tech"
  | "healthcare"
  | "finance"
  | "consulting"
  | "engineering"
  | "legal"

/** Compact experience row used in catalog seeds. */
export interface SeedExperience {
  readonly title: string
  readonly org: string
  readonly location: string
  readonly startDate: string
  readonly endDate: string
  readonly bullets: readonly string[]
  readonly url?: string
}

export interface SeedEducation {
  readonly title: string
  readonly org: string
  readonly location: string
  readonly startDate: string
  readonly endDate: string
  readonly bullets?: readonly string[]
}

export interface ResumeRoleTemplate {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly country: TemplateCountry
  readonly category: RoleTemplateCategory
  /** Why this format fits the employer / role family. */
  readonly description: string
  readonly avatarText: string
  readonly layoutId: ResumeLayoutId
  readonly style: DocumentStyleDto
  readonly person: {
    readonly name: string
    readonly headline: string
    readonly email: string
    readonly phone: string
    readonly location: string
    readonly linkedin: string
    readonly website?: string
  }
  readonly summary: string
  readonly experience: readonly SeedExperience[]
  readonly education: readonly SeedEducation[]
  readonly skills: readonly string[]
  /** Optional extra sections keyed by type. */
  readonly projects?: readonly SeedExperience[]
  readonly certifications?: readonly {
    readonly name: string
    readonly issuer: string
    readonly date: string
    readonly credentialId?: string
  }[]
  readonly languages?: readonly { readonly name: string; readonly proficiency: string }[]
}

export interface CoverLetterRoleTemplate {
  readonly id: string
  readonly title: string
  readonly company: string
  readonly country: TemplateCountry
  readonly category: RoleTemplateCategory
  readonly description: string
  readonly avatarText: string
  readonly layoutId: LetterLayoutId
  readonly style: DocumentStyleDto
  readonly person: {
    readonly name: string
    readonly headline: string
    readonly email: string
    readonly phone: string
    readonly location: string
    readonly linkedin: string
  }
  readonly date: string
  readonly recipient: {
    readonly name: string
    readonly title?: string
    readonly company: string
    readonly addressLines: readonly string[]
  }
  readonly greeting: string
  readonly paragraphs: readonly string[]
  readonly closing: string
}

export type BuiltResumeTemplate = ResumeRoleTemplate & {
  readonly document: ResumeDocument
}

export type BuiltCoverLetterTemplate = CoverLetterRoleTemplate & {
  readonly document: CoverLetterDocument
}

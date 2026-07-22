import { isBlankHtml } from "@/lib/blank-html"
import { sectionIsEmpty, stripHtml } from "../../section-snippet"
import type {
  EducationSection,
  ExperienceSection,
  ResumeDocument,
  ResumeSection,
  SectionEntry,
  SkillsSection,
  SummarySection,
} from "../../types"
import type { AnalysisFinding, AnalysisRuleId, AnalysisSeverity } from "./types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HAS_DIGIT = /\d/
const SUMMARY_MIN_CHARS = 40
const SKILLS_MIN_COUNT = 3
const PHONE_MIN_DIGITS = 7

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function finding(
  ruleId: AnalysisRuleId,
  severity: AnalysisSeverity,
  extra: Partial<AnalysisFinding> & { id?: string } = {}
): AnalysisFinding {
  const { id, messageKey, ...rest } = extra
  return {
    id: id ?? ruleId,
    ruleId,
    severity,
    messageKey: messageKey ?? ruleId,
    ...rest,
  }
}

function contactValue(
  doc: ResumeDocument,
  iconKey: "mail" | "phone" | "mapPin" | "globe" | "link"
): string {
  return doc.header.contacts.find((c) => c.iconKey === iconKey)?.value?.trim() ?? ""
}

function allOfType<T extends ResumeSection["type"]>(
  sections: readonly ResumeSection[],
  type: T
): Extract<ResumeSection, { type: T }>[] {
  return sections.filter((s): s is Extract<ResumeSection, { type: T }> => s.type === type)
}

function sectionEmptyOrMissing(
  sections: readonly ResumeSection[],
  type: ResumeSection["type"]
): boolean {
  const matches = sections.filter((s) => s.type === type)
  if (matches.length === 0) return true
  return matches.every(sectionIsEmpty)
}

function entryHasContent(e: SectionEntry): boolean {
  return (
    hasText(e.title) ||
    hasText(e.org) ||
    hasText(e.location) ||
    hasText(e.url) ||
    hasText(e.startDate) ||
    hasText(e.endDate) ||
    !isBlankHtml(e.bullets)
  )
}

function checkHeader(doc: ResumeDocument, out: AnalysisFinding[]) {
  if (!hasText(doc.header.name)) {
    out.push(finding("missing_name", "critical", { locationKey: "header" }))
  }

  const email = contactValue(doc, "mail")
  if (!email) {
    out.push(finding("missing_email", "high", { locationKey: "contact" }))
  } else if (!EMAIL_RE.test(email)) {
    out.push(finding("invalid_email", "high", { locationKey: "contact" }))
  }

  const phone = contactValue(doc, "phone")
  if (!phone) {
    out.push(finding("missing_phone", "high", { locationKey: "contact" }))
  } else {
    const digits = phone.replace(/\D/g, "")
    if (digits.length < PHONE_MIN_DIGITS) {
      out.push(finding("invalid_phone", "medium", { locationKey: "contact" }))
    }
  }

  if (!contactValue(doc, "mapPin")) {
    out.push(finding("missing_location", "medium", { locationKey: "contact" }))
  }

  if (!contactValue(doc, "link")) {
    out.push(finding("missing_linkedin", "low", { locationKey: "contact" }))
  }
}

function checkSummary(doc: ResumeDocument, out: AnalysisFinding[]) {
  const summaries = allOfType(doc.sections, "summary") as SummarySection[]
  if (summaries.length === 0 || summaries.every(sectionIsEmpty)) {
    out.push(finding("missing_summary", "medium", { locationKey: "summary" }))
    return
  }
  for (const s of summaries) {
    if (sectionIsEmpty(s)) continue
    const plain = stripHtml(s.text).trim()
    if (plain.length > 0 && plain.length < SUMMARY_MIN_CHARS) {
      out.push(
        finding("summary_too_short", "medium", {
          id: `summary_too_short:${s.id}`,
          sectionId: s.id,
          locationKey: "summary",
        })
      )
    }
  }
}

function checkExperience(doc: ResumeDocument, out: AnalysisFinding[]) {
  const sections = allOfType(doc.sections, "experience") as ExperienceSection[]
  if (sectionEmptyOrMissing(doc.sections, "experience")) {
    out.push(finding("missing_experience", "critical", { locationKey: "experience" }))
    return
  }

  let anyMetrics = false
  for (const section of sections) {
    for (const e of section.entries) {
      if (!entryHasContent(e)) continue

      const missingTitle = !hasText(e.title)
      const missingOrg = !hasText(e.org)
      if (missingTitle || missingOrg) {
        out.push(
          finding("incomplete_experience_entry", "high", {
            id: `incomplete_experience_entry:${e.id}`,
            sectionId: section.id,
            entryId: e.id,
            locationKey: "experience",
          })
        )
      }

      const missingDates = !hasText(e.startDate) && !hasText(e.endDate)
      if (missingDates && (hasText(e.title) || hasText(e.org))) {
        out.push(
          finding("incomplete_experience_entry", "medium", {
            id: `incomplete_experience_dates:${e.id}`,
            messageKey: "incomplete_experience_dates",
            sectionId: section.id,
            entryId: e.id,
            locationKey: "experience",
          })
        )
      }

      if ((hasText(e.title) || hasText(e.org)) && isBlankHtml(e.bullets)) {
        out.push(
          finding("empty_experience_bullets", "medium", {
            id: `empty_experience_bullets:${e.id}`,
            sectionId: section.id,
            entryId: e.id,
            locationKey: "experience",
          })
        )
      }

      const bulletText = stripHtml(e.bullets)
      if (HAS_DIGIT.test(bulletText)) anyMetrics = true
    }
  }

  if (!anyMetrics) {
    out.push(finding("no_metrics_in_experience", "low", { locationKey: "experience" }))
  }
}

function checkEducation(doc: ResumeDocument, out: AnalysisFinding[]) {
  const sections = allOfType(doc.sections, "education") as EducationSection[]
  if (sectionEmptyOrMissing(doc.sections, "education")) {
    out.push(finding("missing_education", "critical", { locationKey: "education" }))
    return
  }

  for (const section of sections) {
    for (const e of section.entries) {
      if (!entryHasContent(e)) continue
      if (!hasText(e.title) || !hasText(e.org)) {
        out.push(
          finding("incomplete_education_entry", "medium", {
            id: `incomplete_education_entry:${e.id}`,
            sectionId: section.id,
            entryId: e.id,
            locationKey: "education",
          })
        )
      }
    }
  }
}

function checkSkills(doc: ResumeDocument, out: AnalysisFinding[]) {
  const sections = allOfType(doc.sections, "skills") as SkillsSection[]
  if (sectionEmptyOrMissing(doc.sections, "skills")) {
    out.push(finding("missing_skills", "high", { locationKey: "skills" }))
    return
  }

  let count = 0
  for (const section of sections) {
    for (const item of section.items) {
      if (hasText(item.text)) count += 1
    }
  }
  if (count > 0 && count < SKILLS_MIN_COUNT) {
    out.push(
      finding("thin_skills", "low", {
        locationKey: "skills",
        messageParams: { count, min: SKILLS_MIN_COUNT },
      })
    )
  }
}

/** Sync structural checks only (no Harper). */
export function analyzeStructure(doc: ResumeDocument): AnalysisFinding[] {
  const out: AnalysisFinding[] = []
  checkHeader(doc, out)
  checkSummary(doc, out)
  checkExperience(doc, out)
  checkEducation(doc, out)
  checkSkills(doc, out)
  return out
}

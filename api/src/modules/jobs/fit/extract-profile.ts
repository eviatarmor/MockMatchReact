import { createHash } from "node:crypto"

export type ResumeRowForFit = {
  id: string
  title: string
  targetRole: string | null
  company: string | null
  document: unknown
}

export type ExperienceRole = {
  title: string
  org: string
  dates: string
  bullets: string[]
}

export type ResumeFitProfile = {
  resumeIds: string[]
  resumeCount: number
  profileHash: string
  skills: string[]
  experience: ExperienceRole[]
  targetRoles: string[]
  headlines: string[]
  education: string[]
  certifications: string[]
  summaries: string[]
  /** Compact blob for AI prompts (capped). */
  compactText: string
}

const MAX_SKILLS = 80
const MAX_ROLES = 12
const MAX_BULLETS_PER_ROLE = 3
const MAX_COMPACT = 2000

type Section = Record<string, unknown>

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function uniquePush(list: string[], value: string, seen: Set<string>): void {
  const key = value.toLowerCase()
  if (!value || seen.has(key)) return
  seen.add(key)
  list.push(value)
}

/** Split compound skill chips: "React, Node & TypeScript" / "Python/Django" → separate skills. */
function expandSkillLabel(label: string): string[] {
  return label
    .split(/[,/&]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseBullets(raw: unknown): string[] {
  if (typeof raw === "string") {
    return raw
      .split(/\n|•|;/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim()
        if (item && typeof item === "object" && "text" in item) {
          return asString((item as { text?: unknown }).text)
        }
        return ""
      })
      .filter(Boolean)
  }
  return []
}

function extractFromDocument(doc: unknown): {
  skills: string[]
  experience: ExperienceRole[]
  headline: string
  summary: string
  education: string[]
  certifications: string[]
} {
  const skills: string[] = []
  const skillSeen = new Set<string>()
  const experience: ExperienceRole[] = []
  const education: string[] = []
  const eduSeen = new Set<string>()
  const certifications: string[] = []
  const certSeen = new Set<string>()
  let headline = ""
  let summary = ""

  if (!doc || typeof doc !== "object") {
    return { skills, experience, headline, summary, education, certifications }
  }

  const root = doc as {
    header?: { headline?: unknown; name?: unknown }
    sections?: Section[]
  }

  headline = asString(root.header?.headline)

  for (const section of root.sections ?? []) {
    const type = asString(section.type)
    if (type === "skills" && Array.isArray(section.items)) {
      for (const item of section.items) {
        const label =
          typeof item === "object" && item && "text" in item
            ? asString((item as { text?: unknown }).text)
            : asString(item)
        for (const part of expandSkillLabel(label)) {
          uniquePush(skills, part, skillSeen)
        }
      }
    }
    if (type === "summary") {
      const text = asString(section.text)
      if (text) summary = text
    }
    if (
      (type === "experience" || type === "projects" || type === "volunteering") &&
      Array.isArray(section.entries)
    ) {
      for (const entry of section.entries as Section[]) {
        const title = asString(entry.title)
        const org = asString(entry.org)
        if (!title && !org) continue
        const start = asString(entry.startDate)
        const end = asString(entry.endDate)
        const dates = [start, end].filter(Boolean).join(" – ")
        const bullets = parseBullets(entry.bullets).slice(0, MAX_BULLETS_PER_ROLE)
        experience.push({ title, org, dates, bullets })
      }
    }
    if (type === "education" && Array.isArray(section.entries)) {
      for (const entry of section.entries as Section[]) {
        const title = asString(entry.title)
        const org = asString(entry.org)
        const line = [title, org].filter(Boolean).join(" @ ")
        uniquePush(education, line, eduSeen)
      }
    }
    if (type === "certifications") {
      const name = asString(section.name)
      uniquePush(certifications, name, certSeen)
    }
  }

  return { skills, experience, headline, summary, education, certifications }
}

function buildCompactText(profile: Omit<ResumeFitProfile, "compactText" | "profileHash">): string {
  const lines: string[] = []
  if (profile.targetRoles.length) {
    lines.push(`Target roles: ${profile.targetRoles.join("; ")}`)
  }
  if (profile.headlines.length) {
    lines.push(`Headlines: ${profile.headlines.join("; ")}`)
  }
  if (profile.skills.length) {
    lines.push(`Skills: ${profile.skills.slice(0, 40).join(", ")}`)
  }
  if (profile.summaries.length) {
    lines.push(`Summary: ${profile.summaries.join(" | ").slice(0, 400)}`)
  }
  for (const role of profile.experience.slice(0, 6)) {
    lines.push(
      `Role: ${role.title} @ ${role.org} (${role.dates}) — ${role.bullets.join("; ").slice(0, 220)}`
    )
  }
  if (profile.education.length) {
    lines.push(`Education: ${profile.education.slice(0, 4).join("; ")}`)
  }
  if (profile.certifications.length) {
    lines.push(`Certs: ${profile.certifications.slice(0, 6).join("; ")}`)
  }
  const text = lines.join("\n")
  return text.length > MAX_COMPACT ? `${text.slice(0, MAX_COMPACT - 1)}…` : text
}

/**
 * Merge key facts from all resumes (skills union, roles, targets).
 * No LLM — free + reliable.
 */
export function buildMultiResumeProfile(rows: ResumeRowForFit[]): ResumeFitProfile | null {
  if (rows.length === 0) return null

  const skills: string[] = []
  const skillSeen = new Set<string>()
  const roleMap = new Map<string, ExperienceRole>()
  const targetRoles: string[] = []
  const targetSeen = new Set<string>()
  const headlines: string[] = []
  const headlineSeen = new Set<string>()
  const education: string[] = []
  const eduSeen = new Set<string>()
  const certifications: string[] = []
  const certSeen = new Set<string>()
  const summaries: string[] = []
  const summarySeen = new Set<string>()
  const resumeIds: string[] = []

  for (const row of rows) {
    resumeIds.push(row.id)
    if (row.targetRole) uniquePush(targetRoles, row.targetRole.trim(), targetSeen)

    const extracted = extractFromDocument(row.document)
    for (const s of extracted.skills) uniquePush(skills, s, skillSeen)
    for (const e of extracted.education) uniquePush(education, e, eduSeen)
    for (const c of extracted.certifications) uniquePush(certifications, c, certSeen)
    if (extracted.headline) uniquePush(headlines, extracted.headline, headlineSeen)
    if (extracted.summary) uniquePush(summaries, extracted.summary, summarySeen)

    for (const role of extracted.experience) {
      const key = `${role.title.toLowerCase()}|${role.org.toLowerCase()}`
      const existing = roleMap.get(key)
      if (!existing || role.bullets.join("").length > existing.bullets.join("").length) {
        roleMap.set(key, role)
      }
    }
  }

  // Also treat experience titles as skill-adjacent signals already covered in title match
  const experience = [...roleMap.values()].slice(0, MAX_ROLES)
  const partial = {
    resumeIds,
    resumeCount: rows.length,
    skills: skills.slice(0, MAX_SKILLS),
    experience,
    targetRoles,
    headlines,
    education,
    certifications,
    summaries,
  }

  const compactText = buildCompactText(partial)
  const hashPayload = JSON.stringify({
    skills: partial.skills.map((s) => s.toLowerCase()).sort(),
    experience: partial.experience.map((r) => ({
      t: r.title.toLowerCase(),
      o: r.org.toLowerCase(),
      b: r.bullets,
    })),
    targetRoles: partial.targetRoles.map((s) => s.toLowerCase()).sort(),
    headlines: partial.headlines.map((s) => s.toLowerCase()).sort(),
    education: partial.education.map((s) => s.toLowerCase()).sort(),
    certifications: partial.certifications.map((s) => s.toLowerCase()).sort(),
    summaries: partial.summaries,
  })
  const profileHash = createHash("sha256").update(hashPayload).digest("hex").slice(0, 32)

  return { ...partial, profileHash, compactText }
}

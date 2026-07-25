import { createHash } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import {
  candidateExperience,
  candidateProfiles,
  candidateSkills,
  type WritingStyleJson,
} from "../../db/schema/candidate-profile.js"
import { coverLetters } from "../../db/schema/cover-letters.js"
import { resumes, type ResumeStyleJson } from "../../db/schema/resumes.js"
import { logger } from "../../lib/logger.js"
import {
  buildCompactText,
  extractFromDocument,
  type ExperienceRole,
  type ResumeFitProfile,
} from "../jobs/fit/extract-profile.js"
import {
  analyzeWritingStyle,
  collectCoverLetterTextSamples,
  collectResumeTextSamples,
} from "./writing-style.js"

const MAX_RESUMES = 20
const MAX_LETTERS = 10
const MAX_SKILLS = 80
const MAX_ROLES = 24

function roleFingerprint(title: string, org: string): string {
  return `${title.toLowerCase().trim()}|${org.toLowerCase().trim()}`
}

function skillNorm(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * Full rebuild of the user's candidate content bank from owned resumes + CLs.
 * Idempotent. Safe to call after any document write (including collab flush).
 */
export async function syncCandidateProfile(
  db: Database,
  userId: string
): Promise<void> {
  try {
    await rebuildCandidateProfile(db, userId)
  } catch (error) {
    // Never fail the document write path on bank sync
    logger.warn({ err: error, userId }, "candidate profile sync failed")
  }
}

async function rebuildCandidateProfile(
  db: Database,
  userId: string
): Promise<void> {
  const resumeRows = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      targetRole: resumes.targetRole,
      company: resumes.company,
      document: resumes.document,
      style: resumes.style,
      templateId: resumes.templateId,
      updatedAt: resumes.updatedAt,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(MAX_RESUMES)

  const letterRows = await db
    .select({
      document: coverLetters.document,
      style: coverLetters.style,
      templateId: coverLetters.templateId,
      updatedAt: coverLetters.updatedAt,
    })
    .from(coverLetters)
    .where(eq(coverLetters.userId, userId))
    .orderBy(desc(coverLetters.updatedAt))
    .limit(MAX_LETTERS)

  const skillsMap = new Map<string, { label: string; timesSeen: number }>()
  const roleMap = new Map<
    string,
    ExperienceRole & {
      location: string
      startDate: string
      endDate: string
      sourceResumeId: string
    }
  >()
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
  const textSamples: string[] = []
  const resumeIds: string[] = []

  for (const row of resumeRows) {
    resumeIds.push(row.id)
    if (row.targetRole?.trim() && !targetSeen.has(row.targetRole.toLowerCase())) {
      targetSeen.add(row.targetRole.toLowerCase())
      targetRoles.push(row.targetRole.trim())
    }

    textSamples.push(...collectResumeTextSamples(row.document))
    const extracted = extractFromDocument(row.document)

    for (const s of extracted.skills) {
      const norm = skillNorm(s)
      if (!norm) continue
      const existing = skillsMap.get(norm)
      if (existing) existing.timesSeen += 1
      else skillsMap.set(norm, { label: s, timesSeen: 1 })
    }

    if (extracted.headline && !headlineSeen.has(extracted.headline.toLowerCase())) {
      headlineSeen.add(extracted.headline.toLowerCase())
      headlines.push(extracted.headline)
    }
    if (extracted.summary && !summarySeen.has(extracted.summary.toLowerCase())) {
      summarySeen.add(extracted.summary.toLowerCase())
      summaries.push(extracted.summary)
    }
    for (const e of extracted.education) {
      if (!eduSeen.has(e.toLowerCase())) {
        eduSeen.add(e.toLowerCase())
        education.push(e)
      }
    }
    for (const c of extracted.certifications) {
      if (!certSeen.has(c.toLowerCase())) {
        certSeen.add(c.toLowerCase())
        certifications.push(c)
      }
    }

    for (const role of extracted.experience) {
      const fp = roleFingerprint(role.title, role.org)
      if (!fp || fp === "|") continue
      const existing = roleMap.get(fp)
      const bulletLen = role.bullets.join("").length
      if (!existing || bulletLen > existing.bullets.join("").length) {
        const [start = "", end = ""] = role.dates.split(/\s*[–-]\s*/)
        roleMap.set(fp, {
          ...role,
          location: "",
          startDate: start.trim(),
          endDate: end.trim(),
          sourceResumeId: row.id,
        })
      }
    }
  }

  for (const letter of letterRows) {
    textSamples.push(...collectCoverLetterTextSamples(letter.document))
  }

  const writingStyle: WritingStyleJson = analyzeWritingStyle(textSamples)
  const preferredStyle: ResumeStyleJson | null =
    resumeRows[0]?.style ?? letterRows[0]?.style ?? null
  const preferredTemplateId =
    resumeRows[0]?.templateId ?? letterRows[0]?.templateId ?? null

  const skills = [...skillsMap.values()]
    .sort((a, b) => b.timesSeen - a.timesSeen)
    .slice(0, MAX_SKILLS)
  const experience = [...roleMap.values()].slice(0, MAX_ROLES)

  const partial: Omit<ResumeFitProfile, "compactText" | "profileHash"> = {
    resumeIds,
    resumeCount: resumeRows.length,
    skills: skills.map((s) => s.label),
    experience: experience.map((r) => ({
      title: r.title,
      org: r.org,
      dates: r.dates,
      bullets: r.bullets,
    })),
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
    writing: writingStyle.toneNotes,
  })
  const profileHash = createHash("sha256").update(hashPayload).digest("hex").slice(0, 32)

  // Replace bank rows (full rebuild)
  await db.delete(candidateSkills).where(eq(candidateSkills.userId, userId))
  await db
    .delete(candidateExperience)
    .where(eq(candidateExperience.userId, userId))

  if (skills.length > 0) {
    await db.insert(candidateSkills).values(
      skills.map((s) => ({
        userId,
        label: s.label,
        labelNorm: skillNorm(s.label),
        source: "resume" as const,
        timesSeen: s.timesSeen,
        lastSeenAt: new Date(),
      }))
    )
  }

  if (experience.length > 0) {
    await db.insert(candidateExperience).values(
      experience.map((r) => ({
        userId,
        title: r.title,
        org: r.org,
        location: r.location,
        startDate: r.startDate,
        endDate: r.endDate,
        bullets: r.bullets,
        sourceResumeId: r.sourceResumeId,
        fingerprint: roleFingerprint(r.title, r.org),
        updatedAt: new Date(),
      }))
    )
  }

  await db
    .insert(candidateProfiles)
    .values({
      userId,
      writingStyle,
      preferredStyle,
      preferredTemplateId,
      compactText,
      profileHash,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: candidateProfiles.userId,
      set: {
        writingStyle,
        preferredStyle,
        preferredTemplateId,
        compactText,
        profileHash,
        updatedAt: new Date(),
      },
    })
}

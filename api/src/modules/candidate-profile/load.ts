import { eq } from "drizzle-orm"
import type { Database } from "../../db/client.js"
import {
  candidateExperience,
  candidateProfiles,
  candidateSkills,
  type WritingStyleJson,
  DEFAULT_WRITING_STYLE,
} from "../../db/schema/candidate-profile.js"
import type { ResumeStyleJson } from "../../db/schema/resumes.js"
import {
  buildCompactText,
  type ResumeFitProfile,
} from "../jobs/fit/extract-profile.js"

export type CandidateBank = {
  profile: ResumeFitProfile
  writingStyle: WritingStyleJson
  preferredStyle: ResumeStyleJson | null
  preferredTemplateId: string | null
}

/**
 * Load durable bank as a ResumeFitProfile for scoring / generation.
 * Returns null when bank empty (no skills and no experience and no compact text).
 */
export async function loadCandidateBank(
  db: Database,
  userId: string
): Promise<CandidateBank | null> {
  const profileRow = await db.query.candidateProfiles.findFirst({
    where: eq(candidateProfiles.userId, userId),
  })

  const skillRows = await db
    .select()
    .from(candidateSkills)
    .where(eq(candidateSkills.userId, userId))

  const expRows = await db
    .select()
    .from(candidateExperience)
    .where(eq(candidateExperience.userId, userId))

  if (
    !profileRow &&
    skillRows.length === 0 &&
    expRows.length === 0
  ) {
    return null
  }

  const skills = skillRows.map((s) => s.label)
  const experience = expRows.map((r) => ({
    title: r.title,
    org: r.org,
    dates: [r.startDate, r.endDate].filter(Boolean).join(" – "),
    bullets: Array.isArray(r.bullets) ? r.bullets : [],
  }))

  // Prefer stored compact text; rebuild if missing
  const partial = {
    resumeIds: [] as string[],
    resumeCount: 0,
    skills,
    experience,
    targetRoles: [] as string[],
    headlines: [] as string[],
    education: [] as string[],
    certifications: [] as string[],
    summaries: [] as string[],
  }

  const compactText =
    profileRow?.compactText?.trim() || buildCompactText(partial)
  const profileHash = profileRow?.profileHash || "empty"

  if (!compactText && skills.length === 0 && experience.length === 0) {
    return null
  }

  // Parse target roles / headlines from compact text is lossy — keep empty;
  // scoreFits will fall back to live multi-resume when bank is thin.
  const profile: ResumeFitProfile = {
    ...partial,
    resumeCount: Math.max(1, experience.length > 0 || skills.length > 0 ? 1 : 0),
    compactText,
    profileHash,
  }

  return {
    profile,
    writingStyle: profileRow?.writingStyle ?? DEFAULT_WRITING_STYLE,
    preferredStyle: profileRow?.preferredStyle ?? null,
    preferredTemplateId: profileRow?.preferredTemplateId ?? null,
  }
}

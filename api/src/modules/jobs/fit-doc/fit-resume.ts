import { TRPCError } from "@trpc/server"
import { and, desc, eq } from "drizzle-orm"
import type { FitDocumentResult, FitResumeInput } from "@mockmatch/schemas"
import type { ResumeDocumentDto } from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import type { Database } from "../../../db/client.js"
import { resumes } from "../../../db/schema/resumes.js"
import { logger } from "../../../lib/logger.js"
import {
  getCreditBalance,
  spendCredits,
} from "../../billing/credits.js"
import { loadCandidateBank } from "../../candidate-profile/load.js"
import { syncCandidateProfile } from "../../candidate-profile/sync.js"
import {
  blankResumeDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "../../resumes/defaults.js"
import { scoreJobHeuristic } from "../fit/heuristic.js"
import {
  buildMultiResumeProfile,
  extractFromDocument,
  type ResumeFitProfile,
} from "../fit/extract-profile.js"
import { chatJsonObject, isFitDocAiConfigured } from "./openrouter-json.js"
import { sanitizeResumeDocument } from "./sanitize.js"

function titleForJob(job: FitResumeInput["job"]): string {
  const raw = `${job.title} @ ${job.company}`.trim()
  return raw.slice(0, 200) || "Fitted resume"
}

async function loadSourceResume(
  db: Database,
  userId: string,
  sourceResumeId: string | undefined
) {
  if (sourceResumeId) {
    const rows = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, sourceResumeId), eq(resumes.userId, userId)))
      .limit(1)
    return rows[0] ?? null
  }
  const rows = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(1)
  return rows[0] ?? null
}

function buildSystemPrompt(): string {
  return `You tailor a candidate resume to a job. Return ONLY JSON:
{"document":{"header":{"name":"","headline":"","contacts":[{"id":"","iconKey":"mail|phone|mapPin|globe|link","value":""}]},"sections":[...]}}

Section types allowed: summary, experience, education, skills, projects, volunteering, languages, custom.
Experience entries: {id,title,org,location,url,startDate,endDate,bullets} where bullets is a single string with newlines.
Skills items: {id,text}.

Hard rules:
- NEVER invent employers, degrees, dates, or metrics not present in PROFILE or SOURCE.
- You MAY rephrase bullets and reorder emphasis to match the job.
- Preserve the candidate's writing voice from STYLE notes and sample phrases.
- Prefer concise action-led bullets if style says concise.
- Keep contacts exactly as in SOURCE when provided.
- Output valid JSON only.`
}

function buildUserPrompt(input: {
  job: FitResumeInput["job"]
  profileText: string
  styleNotes: string
  samplePhrases: string[]
  sourceJson: string | null
}): string {
  const job = input.job
  return [
    `JOB:`,
    `title=${job.title}`,
    `company=${job.company}`,
    `location=${job.location ?? ""}`,
    `category=${job.category ?? ""}`,
    `description=${job.description.slice(0, 1800)}`,
    ``,
    `CANDIDATE PROFILE (facts only — do not invent beyond this):`,
    input.profileText,
    ``,
    `WRITING STYLE: ${input.styleNotes}`,
    input.samplePhrases.length
      ? `SAMPLE PHRASES (match voice, do not copy verbatim):\n- ${input.samplePhrases.join("\n- ")}`
      : "",
    ``,
    input.sourceJson
      ? `SOURCE RESUME JSON (structure + contacts to preserve):\n${input.sourceJson.slice(0, 6000)}`
      : "No source resume — build from profile facts.",
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * AI-tailor a new draft resume for a job. Charges resumeScans after success.
 */
export async function fitResumeToJob(
  db: Database,
  userId: string,
  input: FitResumeInput
): Promise<FitDocumentResult> {
  if (!isFitDocAiConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "AI document fit is not configured (missing OPENROUTER_API_KEY).",
    })
  }

  const cost = env.FIT_RESUME_CREDIT_COST
  const balance = await getCreditBalance(db, userId)
  if (cost > 0 && balance.remaining < cost) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not enough credits to fit a resume.",
    })
  }

  await syncCandidateProfile(db, userId)
  let bank = await loadCandidateBank(db, userId)
  const source = await loadSourceResume(db, userId, input.sourceResumeId)

  if (!source && !bank) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Add a resume first so we can fit one to this job.",
    })
  }

  const sourceDoc = (source?.document ?? null) as ResumeDocumentDto | null
  const profileText =
    bank?.profile.compactText ||
    (source
      ? buildMultiResumeProfile([
          {
            id: source.id,
            title: source.title,
            targetRole: source.targetRole,
            company: source.company,
            document: source.document,
          },
        ])?.compactText ?? ""
      : "")

  const writing = bank?.writingStyle
  const styleNotes = writing?.toneNotes ?? "concise bullets, past tense"
  const samplePhrases = writing?.samplePhrases ?? []

  const allowedSkills = new Set(
    (bank?.profile.skills ?? extractFromDocument(sourceDoc).skills).map((s) =>
      s.toLowerCase()
    )
  )

  let generated: ResumeDocumentDto
  try {
    const raw = await chatJsonObject(
      buildSystemPrompt(),
      buildUserPrompt({
        job: input.job,
        profileText: profileText.slice(0, 2500),
        styleNotes,
        samplePhrases,
        sourceJson: sourceDoc ? JSON.stringify(sourceDoc) : null,
      })
    )
    generated = sanitizeResumeDocument(raw, sourceDoc, allowedSkills)
  } catch (error) {
    logger.error({ err: error, userId }, "fit resume generation failed")
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate fitted resume. Try again.",
    })
  }

  const style =
    source?.style ?? bank?.preferredStyle ?? DEFAULT_STYLE
  const templateId =
    source?.templateId ?? bank?.preferredTemplateId ?? DEFAULT_TEMPLATE_ID
  const title = titleForJob(input.job)

  const [row] = await db
    .insert(resumes)
    .values({
      userId,
      title,
      targetRole: input.job.title.slice(0, 200),
      company: input.job.company.slice(0, 200),
      status: "draft",
      templateId,
      style,
      document: generated ?? blankResumeDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to save fitted resume.",
    })
  }

  let creditsCharged = 0
  let remaining = balance.remaining
  if (cost > 0) {
    const spent = await spendCredits(db, userId, cost, "resumeScans")
    if (spent.ok) {
      creditsCharged = cost
      remaining = spent.remaining
    } else {
      // Generation succeeded but charge failed — keep draft, report 0 charge
      remaining = spent.remaining
      logger.warn({ userId, cost }, "fit resume credit spend failed after save")
    }
  }

  await syncCandidateProfile(db, userId)

  const extracted = extractFromDocument(generated)
  const scoreProfile: ResumeFitProfile = {
    resumeIds: [row.id],
    resumeCount: 1,
    profileHash: bank?.profile.profileHash ?? "fit",
    skills: extracted.skills,
    experience: extracted.experience,
    targetRoles: [input.job.title],
    headlines: [generated.header.headline].filter(Boolean),
    education: extracted.education,
    certifications: extracted.certifications,
    summaries: extracted.summary ? [extracted.summary] : [],
    compactText: profileText.slice(0, 2000),
  }
  if (bank) {
    const seen = new Set(scoreProfile.skills.map((s) => s.toLowerCase()))
    for (const s of bank.profile.skills) {
      if (!seen.has(s.toLowerCase())) scoreProfile.skills.push(s)
    }
  }

  const fitScore = scoreJobHeuristic(scoreProfile, input.job)

  return {
    documentId: row.id,
    title: row.title,
    fitScore,
    creditsCharged,
    creditsRemaining: remaining,
    mode: "ai",
  }
}

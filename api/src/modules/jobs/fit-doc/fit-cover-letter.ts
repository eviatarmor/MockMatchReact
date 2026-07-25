import { TRPCError } from "@trpc/server"
import { and, desc, eq } from "drizzle-orm"
import type {
  CoverLetterDocumentDto,
  FitCoverLetterInput,
  FitDocumentResult,
  ResumeDocumentDto,
} from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import type { Database } from "../../../db/client.js"
import { coverLetters } from "../../../db/schema/cover-letters.js"
import { resumes } from "../../../db/schema/resumes.js"
import { logger } from "../../../lib/logger.js"
import {
  getCreditBalance,
  spendCredits,
} from "../../billing/credits.js"
import { loadCandidateBank } from "../../candidate-profile/load.js"
import { syncCandidateProfile } from "../../candidate-profile/sync.js"
import {
  blankCoverLetterDocument,
  DEFAULT_STYLE,
  DEFAULT_TEMPLATE_ID,
} from "../../cover-letters/defaults.js"
import { scoreJobHeuristic } from "../fit/heuristic.js"
import {
  buildMultiResumeProfile,
  extractFromDocument,
  type ResumeFitProfile,
} from "../fit/extract-profile.js"
import { chatJsonObject, isFitDocAiConfigured } from "./openrouter-json.js"
import { sanitizeCoverLetterDocument } from "./sanitize.js"

function titleForJob(job: FitCoverLetterInput["job"]): string {
  const raw = `Cover — ${job.title} @ ${job.company}`.trim()
  return raw.slice(0, 200) || "Fitted cover letter"
}

async function loadSourceLetter(
  db: Database,
  userId: string,
  sourceCoverLetterId: string | undefined
) {
  if (sourceCoverLetterId) {
    const rows = await db
      .select()
      .from(coverLetters)
      .where(
        and(
          eq(coverLetters.id, sourceCoverLetterId),
          eq(coverLetters.userId, userId)
        )
      )
      .limit(1)
    return rows[0] ?? null
  }
  const rows = await db
    .select()
    .from(coverLetters)
    .where(eq(coverLetters.userId, userId))
    .orderBy(desc(coverLetters.updatedAt))
    .limit(1)
  return rows[0] ?? null
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
  return `You write a tailored cover letter for a job. Return ONLY JSON:
{"document":{"sender":{"name":"","title":"","contacts":[{"id":"","iconKey":"mail|phone|mapPin|globe|link","value":""}]},"date":"YYYY-MM-DD","recipient":{"name":"","title":"","company":"","addressLines":[]},"blocks":[{"id":"","type":"greeting|paragraph|subject|signoff|custom","text":"","closing":"","signature":"","heading":""}]}}

Hard rules:
- NEVER invent employers, degrees, metrics, or skills not in PROFILE/SOURCE.
- Match WRITING STYLE (formality, first-person rate, sentence length).
- 3–4 short paragraphs max plus greeting and signoff.
- Set recipient.company to the job company.
- Preserve sender contacts from SOURCE when provided.
- JSON only.`
}

/**
 * AI-tailor a new draft cover letter for a job. Charges coverLetters after success.
 */
export async function fitCoverLetterToJob(
  db: Database,
  userId: string,
  input: FitCoverLetterInput
): Promise<FitDocumentResult> {
  if (!isFitDocAiConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "AI document fit is not configured (missing OPENROUTER_API_KEY).",
    })
  }

  const cost = env.FIT_COVER_LETTER_CREDIT_COST
  const balance = await getCreditBalance(db, userId)
  if (cost > 0 && balance.remaining < cost) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not enough credits to fit a cover letter.",
    })
  }

  await syncCandidateProfile(db, userId)
  const bank = await loadCandidateBank(db, userId)
  const sourceLetter = await loadSourceLetter(db, userId, input.sourceCoverLetterId)
  const sourceResume = await loadSourceResume(db, userId, input.sourceResumeId)

  if (!sourceLetter && !sourceResume && !bank) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Add a resume or cover letter first so we can fit one to this job.",
    })
  }

  const sourceDoc = (sourceLetter?.document ?? null) as CoverLetterDocumentDto | null
  const resumeDoc = (sourceResume?.document ?? null) as ResumeDocumentDto | null

  const profileText =
    bank?.profile.compactText ||
    (sourceResume
      ? buildMultiResumeProfile([
          {
            id: sourceResume.id,
            title: sourceResume.title,
            targetRole: sourceResume.targetRole,
            company: sourceResume.company,
            document: sourceResume.document,
          },
        ])?.compactText ?? ""
      : "")

  const writing = bank?.writingStyle
  const styleNotes = writing?.toneNotes ?? "professional, concise"
  const samplePhrases = writing?.samplePhrases ?? []

  // Seed sender from resume header if no CL
  const seedSender =
    sourceDoc?.sender ??
    (resumeDoc
      ? {
          name: resumeDoc.header.name,
          title: resumeDoc.header.headline,
          contacts: resumeDoc.header.contacts,
        }
      : null)

  let generated: CoverLetterDocumentDto
  try {
    const userPrompt = [
      `JOB: ${input.job.title} @ ${input.job.company}`,
      `location=${input.job.location ?? ""} category=${input.job.category ?? ""}`,
      `description=${input.job.description.slice(0, 1600)}`,
      ``,
      `CANDIDATE PROFILE:`,
      profileText.slice(0, 2200),
      ``,
      `WRITING STYLE: ${styleNotes}`,
      samplePhrases.length
        ? `SAMPLES:\n- ${samplePhrases.join("\n- ")}`
        : "",
      seedSender
        ? `SENDER: ${JSON.stringify(seedSender).slice(0, 800)}`
        : "",
      sourceDoc
        ? `SOURCE COVER LETTER JSON:\n${JSON.stringify(sourceDoc).slice(0, 4000)}`
        : "No prior cover letter — write fresh using profile + style.",
    ]
      .filter(Boolean)
      .join("\n")

    const raw = await chatJsonObject(buildSystemPrompt(), userPrompt)
    generated = sanitizeCoverLetterDocument(raw, sourceDoc, input.job.company)
    if (seedSender && !generated.sender.name) {
      generated = {
        ...generated,
        sender: {
          name: seedSender.name,
          title: seedSender.title,
          contacts: seedSender.contacts,
        },
      }
    }
  } catch (error) {
    logger.error({ err: error, userId }, "fit cover letter generation failed")
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate fitted cover letter. Try again.",
    })
  }

  const style =
    sourceLetter?.style ?? bank?.preferredStyle ?? DEFAULT_STYLE
  const templateId =
    sourceLetter?.templateId ??
    bank?.preferredTemplateId ??
    DEFAULT_TEMPLATE_ID
  const title = titleForJob(input.job)

  const [row] = await db
    .insert(coverLetters)
    .values({
      userId,
      title,
      company: input.job.company.slice(0, 200),
      status: "draft",
      templateId,
      style,
      document: generated ?? blankCoverLetterDocument(),
    })
    .returning()

  if (!row) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to save fitted cover letter.",
    })
  }

  let creditsCharged = 0
  let remaining = balance.remaining
  if (cost > 0) {
    const spent = await spendCredits(db, userId, cost, "coverLetters")
    if (spent.ok) {
      creditsCharged = cost
      remaining = spent.remaining
    } else {
      remaining = spent.remaining
      logger.warn({ userId, cost }, "fit cover letter credit spend failed after save")
    }
  }

  await syncCandidateProfile(db, userId)

  // Score using bank / resume facts (letter body is narrative)
  const baseProfile: ResumeFitProfile =
    bank?.profile ??
    buildMultiResumeProfile(
      sourceResume
        ? [
            {
              id: sourceResume.id,
              title: sourceResume.title,
              targetRole: sourceResume.targetRole,
              company: sourceResume.company,
              document: sourceResume.document,
            },
          ]
        : []
    ) ?? {
      resumeIds: [],
      resumeCount: 0,
      profileHash: "cl",
      skills: [],
      experience: [],
      targetRoles: [input.job.title],
      headlines: [],
      education: [],
      certifications: [],
      summaries: [],
      compactText: "",
    }

  if (sourceResume) {
    const ex = extractFromDocument(sourceResume.document)
    baseProfile.skills = [...new Set([...baseProfile.skills, ...ex.skills])]
  }

  const fitScore = scoreJobHeuristic(baseProfile, input.job)

  return {
    documentId: row.id,
    title: row.title,
    fitScore,
    creditsCharged,
    creditsRemaining: remaining,
    mode: "ai",
  }
}

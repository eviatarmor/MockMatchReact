import { desc, eq } from "drizzle-orm"
import type {
  FitScore,
  JobFitStub,
  ScoreFitsInput,
  ScoreFitsResult,
} from "@mockmatch/schemas"
import { env } from "../../../config/env.js"
import type { Database } from "../../../db/client.js"
import { resumes } from "../../../db/schema/resumes.js"
import { getRedis } from "../../../lib/redis.js"
import { logger } from "../../../lib/logger.js"
import {
  getCreditBalance,
  spendCredits,
} from "../../billing/credits.js"
import { scoreJobsWithAi, isFitAiConfigured } from "./ai-score.js"
import {
  buildMultiResumeProfile,
  type ResumeFitProfile,
  type ResumeRowForFit,
} from "./extract-profile.js"
import { scoreJobsHeuristic } from "./heuristic.js"

const MAX_RESUMES = 20
const AI_BATCH = 8
const AI_SCORE_TTL_SEC = 7 * 24 * 60 * 60
/** Equal weight: skills/structure (heuristic) + judgment (AI). */
const HEURISTIC_WEIGHT = 0.5
const AI_WEIGHT = 0.5

function aiCacheKey(profileHash: string, jobId: string): string {
  // v2 = raw AI only (blend with fresh heuristic on read)
  return `jobs:fit:ai:v2:${profileHash}:${jobId}`
}

function tierFromScore(score: number): FitScore["tier"] {
  if (score >= 85) return "strong"
  if (score >= 70) return "good"
  return "fair"
}

function mergeSkills(
  heuristic: FitScore["skills"],
  ai: FitScore["skills"]
): FitScore["skills"] {
  const byLabel = new Map<string, { label: string; matched: boolean }>()
  for (const s of [...heuristic, ...ai]) {
    const key = s.label.toLowerCase()
    const existing = byLabel.get(key)
    if (!existing) {
      byLabel.set(key, { label: s.label, matched: s.matched })
    } else if (s.matched && !existing.matched) {
      byLabel.set(key, { label: existing.label, matched: true })
    }
  }
  const merged = [...byLabel.values()]
  const matched = merged.filter((s) => s.matched)
  const unmatched = merged.filter((s) => !s.matched)
  return [...matched, ...unmatched].slice(0, 6)
}

/**
 * Average heuristic + AI. Heuristic grounds skills; AI adds nuance.
 * mode stays "ai" so UI shows AI-assisted match was used.
 */
export function blendHeuristicAndAi(
  heuristic: FitScore,
  ai: FitScore
): FitScore {
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(heuristic.score * HEURISTIC_WEIGHT + ai.score * AI_WEIGHT)
    )
  )
  return {
    score,
    tier: tierFromScore(score),
    fitNote: (ai.fitNote || heuristic.fitNote).slice(0, 200),
    skills: mergeSkills(heuristic.skills, ai.skills),
    mode: "ai",
  }
}

async function getCachedAiScore(
  profileHash: string,
  jobId: string
): Promise<FitScore | null> {
  try {
    const raw = await getRedis().get(aiCacheKey(profileHash, jobId))
    if (!raw) return null
    return JSON.parse(raw) as FitScore
  } catch {
    return null
  }
}

async function setCachedAiScore(
  profileHash: string,
  jobId: string,
  score: FitScore
): Promise<void> {
  try {
    await getRedis().set(
      aiCacheKey(profileHash, jobId),
      JSON.stringify(score),
      "EX",
      AI_SCORE_TTL_SEC
    )
  } catch (error) {
    logger.warn({ err: error }, "fit ai cache set failed")
  }
}

async function loadResumeRows(
  db: Database,
  userId: string
): Promise<ResumeRowForFit[]> {
  const rows = await db
    .select({
      id: resumes.id,
      title: resumes.title,
      targetRole: resumes.targetRole,
      company: resumes.company,
      document: resumes.document,
    })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt))
    .limit(MAX_RESUMES)

  return rows
}

function clampJobs(jobs: JobFitStub[]): JobFitStub[] {
  return jobs.map((j) => ({
    ...j,
    description: j.description.slice(0, 2000),
    title: j.title.slice(0, 300),
    company: j.company.slice(0, 200),
  }))
}

async function runAiBatches(
  profile: ResumeFitProfile,
  jobs: JobFitStub[]
): Promise<Record<string, FitScore>> {
  const out: Record<string, FitScore> = {}
  for (let i = 0; i < jobs.length; i += AI_BATCH) {
    const chunk = jobs.slice(i, i + AI_BATCH)
    const scored = await scoreJobsWithAi(profile, chunk)
    Object.assign(out, scored)
  }
  return out
}

/**
 * Score job fits for Discover.
 * Free / no credits → heuristic only (never OpenRouter).
 * Credits + OpenRouter → AI for uncached jobs, charge per AI job scored.
 */
export async function scoreJobFits(
  db: Database,
  userId: string,
  input: ScoreFitsInput
): Promise<ScoreFitsResult> {
  const jobs = clampJobs(input.jobs)
  const balance = await getCreditBalance(db, userId)
  const rows = await loadResumeRows(db, userId)
  const profile = buildMultiResumeProfile(rows)

  if (!profile) {
    return {
      resumeCount: 0,
      profileHash: null,
      mode: "none",
      scores: {},
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  const costPerJob = env.JOB_FIT_AI_CREDIT_COST
  const preferAi = input.preferAi !== false
  const canTryAi =
    preferAi &&
    balance.remaining >= costPerJob &&
    isFitAiConfigured()

  // Always compute heuristic baseline
  const heuristic = scoreJobsHeuristic(profile, jobs)

  if (!canTryAi) {
    return {
      resumeCount: profile.resumeCount,
      profileHash: profile.profileHash,
      mode: "heuristic",
      scores: heuristic,
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  // Start from heuristic; AI path blends on top
  const scores: Record<string, FitScore> = { ...heuristic }
  const needAi: JobFitStub[] = []
  let usedAi = 0

  for (const job of jobs) {
    const base = heuristic[job.id]!
    const cachedAi = await getCachedAiScore(profile.profileHash, job.id)
    if (cachedAi) {
      scores[job.id] = blendHeuristicAndAi(base, cachedAi)
      usedAi++
    } else {
      needAi.push(job)
    }
  }

  if (needAi.length === 0) {
    return {
      resumeCount: profile.resumeCount,
      profileHash: profile.profileHash,
      mode: "ai",
      scores,
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  // Cap AI volume by remaining credits
  const maxAiJobs = Math.floor(balance.remaining / costPerJob)
  const toScore = needAi.slice(0, maxAiJobs)

  if (toScore.length === 0) {
    return {
      resumeCount: profile.resumeCount,
      profileHash: profile.profileHash,
      mode: usedAi > 0 ? "ai" : "heuristic",
      scores,
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  const aiResults = await runAiBatches(profile, toScore)
  const aiJobIds = Object.keys(aiResults)

  // Charge only for successfully AI-scored jobs; cache raw AI; store blend
  let creditsCharged = 0
  let remaining = balance.remaining
  if (aiJobIds.length > 0) {
    const charge = aiJobIds.length * costPerJob
    const spent = await spendCredits(db, userId, charge, "jobFits")
    if (spent.ok) {
      creditsCharged = charge
      remaining = spent.remaining
      for (const id of aiJobIds) {
        const rawAi = aiResults[id]!
        await setCachedAiScore(profile.profileHash, id, rawAi)
        scores[id] = blendHeuristicAndAi(heuristic[id]!, rawAi)
        usedAi++
      }
    } else {
      remaining = spent.remaining
      logger.warn({ userId, charge }, "fit ai spend failed — heuristic kept")
    }
  }

  return {
    resumeCount: profile.resumeCount,
    profileHash: profile.profileHash,
    mode: usedAi > 0 ? "ai" : "heuristic",
    scores,
    creditsCharged,
    creditsRemaining: remaining,
  }
}

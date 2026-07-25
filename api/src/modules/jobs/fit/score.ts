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
import { loadCandidateBank } from "../../candidate-profile/load.js"
import { syncCandidateProfile } from "../../candidate-profile/sync.js"
import {
  buildMultiResumeProfile,
  type ResumeFitProfile,
  type ResumeRowForFit,
} from "./extract-profile.js"
import { scoreJobsHeuristic } from "./heuristic.js"
import { tierFromScore } from "./tier.js"

const MAX_RESUMES = 20
const AI_BATCH = 8
const AI_SCORE_TTL_SEC = 7 * 24 * 60 * 60
/** Equal weight: skills/structure (heuristic) + judgment (AI). */
const HEURISTIC_WEIGHT = 0.5
const AI_WEIGHT = 0.5

function aiCacheKey(profileHash: string, jobId: string): string {
  // v3 = job-required skills + weak tier (invalidate old matched-gap tags)
  return `jobs:fit:ai:v3:${profileHash}:${jobId}`
}

function mergeSkills(
  heuristic: FitScore["skills"],
  ai: FitScore["skills"]
): FitScore["skills"] {
  // Prefer AI job-required skills; fill from heuristic extract if sparse
  const byLabel = new Map<string, { label: string; matched: boolean }>()
  for (const s of [...ai, ...heuristic]) {
    const key = s.label.toLowerCase()
    if (!byLabel.has(key)) {
      byLabel.set(key, { label: s.label, matched: false })
    }
  }
  return [...byLabel.values()].slice(0, 6)
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

  // Prefer durable bank (skills/experience union) when available; enrich with live docs
  let fitProfile = profile
  let bank = await loadCandidateBank(db, userId)
  if (
    !bank ||
    (bank.profile.skills.length === 0 && bank.profile.experience.length === 0)
  ) {
    await syncCandidateProfile(db, userId)
    bank = await loadCandidateBank(db, userId)
  }
  if (bank) {
    fitProfile = mergeProfiles(profile, bank.profile)
  }

  const costPerJob = env.JOB_FIT_AI_CREDIT_COST
  const preferAi = input.preferAi !== false
  const canTryAi =
    preferAi &&
    isFitAiConfigured() &&
    (costPerJob === 0 || balance.remaining >= costPerJob)

  // Always compute heuristic baseline
  const heuristic = scoreJobsHeuristic(fitProfile, jobs)

  if (!canTryAi) {
    return {
      resumeCount: fitProfile.resumeCount,
      profileHash: fitProfile.profileHash,
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
    const cachedAi = await getCachedAiScore(fitProfile.profileHash, job.id)
    if (cachedAi) {
      scores[job.id] = blendHeuristicAndAi(base, cachedAi)
      usedAi++
    } else {
      needAi.push(job)
    }
  }

  if (needAi.length === 0) {
    return {
      resumeCount: fitProfile.resumeCount,
      profileHash: fitProfile.profileHash,
      mode: "ai",
      scores,
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  // Cap AI volume by remaining credits (unlimited when cost is 0)
  const maxAiJobs =
    costPerJob === 0 ? needAi.length : Math.floor(balance.remaining / costPerJob)
  const toScore = needAi.slice(0, maxAiJobs)

  if (toScore.length === 0) {
    return {
      resumeCount: fitProfile.resumeCount,
      profileHash: fitProfile.profileHash,
      mode: usedAi > 0 ? "ai" : "heuristic",
      scores,
      creditsCharged: 0,
      creditsRemaining: balance.remaining,
    }
  }

  const aiResults = await runAiBatches(fitProfile, toScore)
  const aiJobIds = Object.keys(aiResults)

  // Charge only for successfully AI-scored jobs; cache raw AI; store blend
  let creditsCharged = 0
  let remaining = balance.remaining
  if (aiJobIds.length > 0) {
    const charge = aiJobIds.length * costPerJob
    if (charge === 0) {
      for (const id of aiJobIds) {
        const rawAi = aiResults[id]!
        await setCachedAiScore(fitProfile.profileHash, id, rawAi)
        scores[id] = blendHeuristicAndAi(heuristic[id]!, rawAi)
        usedAi++
      }
    } else {
      const spent = await spendCredits(db, userId, charge, "jobFits")
      if (spent.ok) {
        creditsCharged = charge
        remaining = spent.remaining
        for (const id of aiJobIds) {
          const rawAi = aiResults[id]!
          await setCachedAiScore(fitProfile.profileHash, id, rawAi)
          scores[id] = blendHeuristicAndAi(heuristic[id]!, rawAi)
          usedAi++
        }
      } else {
        remaining = spent.remaining
        logger.warn({ userId, charge }, "fit ai spend failed — heuristic kept")
      }
    }
  }

  return {
    resumeCount: fitProfile.resumeCount,
    profileHash: fitProfile.profileHash,
    mode: usedAi > 0 ? "ai" : "heuristic",
    scores,
    creditsCharged,
    creditsRemaining: remaining,
  }
}

/** Union bank skills/roles into live multi-resume profile. */
function mergeProfiles(
  live: ResumeFitProfile,
  bank: ResumeFitProfile
): ResumeFitProfile {
  const skillSeen = new Set(live.skills.map((s) => s.toLowerCase()))
  const skills = [...live.skills]
  for (const s of bank.skills) {
    const key = s.toLowerCase()
    if (skillSeen.has(key)) continue
    skillSeen.add(key)
    skills.push(s)
  }

  const roleMap = new Map(
    live.experience.map((r) => [`${r.title.toLowerCase()}|${r.org.toLowerCase()}`, r])
  )
  for (const r of bank.experience) {
    const key = `${r.title.toLowerCase()}|${r.org.toLowerCase()}`
    if (!roleMap.has(key)) roleMap.set(key, r)
  }

  const experience = [...roleMap.values()]
  const profileHash =
    bank.profileHash && bank.profileHash !== "empty"
      ? bank.profileHash
      : live.profileHash

  return {
    ...live,
    skills: skills.slice(0, 80),
    experience: experience.slice(0, 12),
    compactText:
      bank.compactText.length >= live.compactText.length
        ? bank.compactText
        : live.compactText,
    profileHash,
  }
}

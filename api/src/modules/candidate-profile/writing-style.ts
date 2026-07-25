import type { WritingStyleJson } from "../../db/schema/candidate-profile.js"
import { DEFAULT_WRITING_STYLE } from "../../db/schema/candidate-profile.js"

const ACTION_VERBS = new Set(
  [
    "achieved",
    "built",
    "created",
    "designed",
    "developed",
    "delivered",
    "drove",
    "enabled",
    "engineered",
    "improved",
    "increased",
    "launched",
    "led",
    "managed",
    "owned",
    "optimized",
    "reduced",
    "shipped",
    "scaled",
    "implemented",
    "architected",
    "collaborated",
    "analyzed",
    "automated",
    "mentored",
  ].map((v) => v.toLowerCase())
)

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function firstWord(text: string): string {
  const m = text.trim().match(/^[A-Za-z]+/)
  return m?.[0]?.toLowerCase() ?? ""
}

/**
 * Free heuristic writing-style fingerprint from resume bullets + CL paragraphs.
 */
export function analyzeWritingStyle(samples: string[]): WritingStyleJson {
  const cleaned = samples.map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean)
  if (cleaned.length === 0) return { ...DEFAULT_WRITING_STYLE }

  const sentences = cleaned.flatMap(splitSentences)
  const sentenceLens = sentences.map(wordCount).filter((n) => n > 0)
  const avgSentenceLen =
    sentenceLens.length === 0
      ? DEFAULT_WRITING_STYLE.avgSentenceLen
      : sentenceLens.reduce((a, b) => a + b, 0) / sentenceLens.length

  const bulletLens = cleaned.map((s) => s.length)
  const avgBulletLen =
    bulletLens.reduce((a, b) => a + b, 0) / Math.max(1, bulletLens.length)

  let firstPerson = 0
  let actionHits = 0
  let quantHits = 0
  let pastHits = 0
  let presentHits = 0

  for (const line of cleaned) {
    const lower = line.toLowerCase()
    if (/\b(i|i'm|i’ve|i've|my|me)\b/.test(lower)) firstPerson++
    const fw = firstWord(line)
    if (ACTION_VERBS.has(fw) || ACTION_VERBS.has(fw.replace(/ed$|ing$/, ""))) {
      actionHits++
    }
    if (/\d|%|\$|k\b|million|billion/i.test(line)) quantHits++
    if (/\b(ed|led|built|drove|shipped|managed)\b/i.test(line)) pastHits++
    if (/\b(ing|build|lead|drive|ship|manage)\b/i.test(line) && !/\bed\b/i.test(line)) {
      presentHits++
    }
  }

  const n = cleaned.length
  const firstPersonRate = firstPerson / n
  const actionVerbRate = actionHits / n
  const quantifierRate = quantHits / n

  let tensePreference: WritingStyleJson["tensePreference"] = "mixed"
  if (pastHits > presentHits * 1.4) tensePreference = "past"
  else if (presentHits > pastHits * 1.4) tensePreference = "present"

  const formality: WritingStyleJson["formality"] =
    avgSentenceLen > 22 || firstPersonRate > 0.35
      ? "narrative"
      : avgBulletLen < 120 && actionVerbRate > 0.25
        ? "concise"
        : "mixed"

  const samplePhrases = cleaned
    .filter((s) => s.length >= 24 && s.length <= 160)
    .slice(0, 8)

  const toneParts: string[] = []
  if (formality === "concise") toneParts.push("concise bullets")
  if (formality === "narrative") toneParts.push("narrative prose")
  if (quantifierRate > 0.25) toneParts.push("metrics-heavy")
  if (actionVerbRate > 0.35) toneParts.push("action-led")
  if (firstPersonRate > 0.3) toneParts.push("first-person")
  toneParts.push(`${tensePreference} tense`)

  return {
    avgSentenceLen: Math.round(avgSentenceLen * 10) / 10,
    avgBulletLen: Math.round(avgBulletLen),
    firstPersonRate: Math.round(firstPersonRate * 100) / 100,
    actionVerbRate: Math.round(actionVerbRate * 100) / 100,
    quantifierRate: Math.round(quantifierRate * 100) / 100,
    tensePreference,
    formality,
    samplePhrases,
    toneNotes: toneParts.join(", "),
  }
}

/** Collect free-text samples from a resume document for style analysis. */
export function collectResumeTextSamples(doc: unknown): string[] {
  if (!doc || typeof doc !== "object") return []
  const root = doc as { sections?: Array<Record<string, unknown>> }
  const out: string[] = []
  for (const section of root.sections ?? []) {
    const type = typeof section.type === "string" ? section.type : ""
    if (type === "summary" && typeof section.text === "string" && section.text.trim()) {
      out.push(section.text.trim())
    }
    if (
      (type === "experience" || type === "projects" || type === "volunteering") &&
      Array.isArray(section.entries)
    ) {
      for (const entry of section.entries as Array<Record<string, unknown>>) {
        const bullets = entry.bullets
        if (typeof bullets === "string") {
          for (const line of bullets.split(/\n|•|;/)) {
            const t = line.trim()
            if (t) out.push(t)
          }
        } else if (Array.isArray(bullets)) {
          for (const b of bullets) {
            if (typeof b === "string" && b.trim()) out.push(b.trim())
            else if (b && typeof b === "object" && "text" in b) {
              const t = String((b as { text?: unknown }).text ?? "").trim()
              if (t) out.push(t)
            }
          }
        }
      }
    }
  }
  return out
}

/** Collect free-text samples from a cover letter document. */
export function collectCoverLetterTextSamples(doc: unknown): string[] {
  if (!doc || typeof doc !== "object") return []
  const root = doc as { blocks?: Array<Record<string, unknown>> }
  const out: string[] = []
  for (const block of root.blocks ?? []) {
    const type = typeof block.type === "string" ? block.type : ""
    if (
      (type === "paragraph" || type === "greeting" || type === "custom") &&
      typeof block.text === "string" &&
      block.text.trim()
    ) {
      out.push(block.text.trim())
    }
  }
  return out
}

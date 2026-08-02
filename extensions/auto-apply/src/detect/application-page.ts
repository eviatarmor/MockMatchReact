/**
 * Heuristics: is this tab a job application surface?
 * Used by the content script to decide whether the on-page chip mounts.
 * Pure DOM/URL checks — no network.
 */

export type ApplicationDetection =
  | { match: false; reason: string }
  | {
      match: true
      score: number
      signals: readonly string[]
      /** Best-effort ATS / host label for UI later. */
      site: string
    }

/** Minimum score to show the chip. Tunable. */
export const APPLICATION_SCORE_THRESHOLD = 4

const MOCKMATCH_HOST_RE =
  /(^|\.)mockmatch\.(com|ai|dev|local)$|^(localhost|127\.0\.0\.1)$/i

/** Product / docs / extension dev surfaces we never treat as ATS. */
const EXCLUDED_PORTS = new Set(["5173", "5180", "3001", "7860"])

const ATS_HOST_PATTERNS: { re: RegExp; site: string; score: number }[] = [
  { re: /(^|\.)greenhouse\.io$/i, site: "Greenhouse", score: 6 },
  { re: /(^|\.)lever\.co$/i, site: "Lever", score: 6 },
  { re: /(^|\.)myworkdayjobs\.com$/i, site: "Workday", score: 6 },
  { re: /(^|\.)workday\.com$/i, site: "Workday", score: 4 },
  { re: /(^|\.)ashbyhq\.com$/i, site: "Ashby", score: 6 },
  { re: /(^|\.)smartrecruiters\.com$/i, site: "SmartRecruiters", score: 6 },
  { re: /(^|\.)icims\.com$/i, site: "iCIMS", score: 5 },
  { re: /(^|\.)jobvite\.com$/i, site: "Jobvite", score: 5 },
  { re: /(^|\.)bamboohr\.com$/i, site: "BambooHR", score: 5 },
  { re: /(^|\.)taleo\.net$/i, site: "Taleo", score: 5 },
  { re: /successfactors/i, site: "SuccessFactors", score: 5 },
  { re: /(^|\.)workable\.com$/i, site: "Workable", score: 5 },
  { re: /(^|\.)breezy\.hr$/i, site: "Breezy", score: 5 },
  { re: /(^|\.)recruitee\.com$/i, site: "Recruitee", score: 5 },
  { re: /(^|\.)teamtailor\.com$/i, site: "Teamtailor", score: 5 },
  { re: /(^|\.)applytojob\.com$/i, site: "JazzHR", score: 5 },
  { re: /(^|\.)jobs\.github\.com$/i, site: "GitHub Jobs", score: 4 },
]

/** Path / query tokens that strongly suggest apply flow. */
const URL_APPLY_RE =
  /\/(apply|application|applications|careers?\/.+\/apply|jobs?\/.+\/apply|job\/.+\/apply|positions?\/.+\/apply)(\/|$|\?)/i

const URL_CAREERS_RE =
  /\/(careers?|jobs?|job|positions?|openings?|vacancies)(\/|$|\?)/i

const FIELD_NAME_RE =
  /resume|cv|cover[_-]?letter|first[_-]?name|last[_-]?name|full[_-]?name|phone|mobile|linkedin|work[_-]?auth|authorization|salary|eeo|disability|veteran|gender|ethnicity|location|city|country|postal|zip/i

const APPLY_TEXT_RE =
  /\b(apply(ing)?\s+(now|for|to)|submit\s+application|application\s+form|upload\s+(your\s+)?(resume|cv)|attach\s+(your\s+)?(resume|cv)|cover\s+letter|equal\s+opportunity|work\s+authorization)\b/i

export function isExcludedHost(url: URL): boolean {
  const host = url.hostname.toLowerCase()

  if (MOCKMATCH_HOST_RE.test(host)) return true

  // Local product stack (client / extension preview / voice) — not ATS.
  if (
    (host === "localhost" || host === "127.0.0.1") &&
    EXCLUDED_PORTS.has(url.port)
  ) {
    return true
  }

  return false
}

function matchAtsHost(hostname: string): { site: string; score: number } | null {
  for (const { re, site, score } of ATS_HOST_PATTERNS) {
    if (re.test(hostname)) return { site, score }
  }
  return null
}

function scoreUrl(url: URL, signals: string[]): number {
  let score = 0
  const pathQ = `${url.pathname}${url.search}`

  if (URL_APPLY_RE.test(pathQ)) {
    score += 4
    signals.push("url:apply-path")
  } else if (URL_CAREERS_RE.test(pathQ)) {
    score += 2
    signals.push("url:careers-path")
  }

  if (/[?&](gh_jid|lever-source|ashby_jid)=/i.test(url.search)) {
    score += 3
    signals.push("url:ats-query")
  }

  // LinkedIn / Indeed apply deep links
  if (
    /(^|\.)linkedin\.com$/i.test(url.hostname) &&
    /\/jobs\/view\/|\/jobs\/collections\/|\/easy-apply/i.test(pathQ)
  ) {
    score += 3
    signals.push("url:linkedin-job")
  }
  if (
    /(^|\.)indeed\.com$/i.test(url.hostname) &&
    /\/(viewjob|apply|rc\/clk)/i.test(pathQ)
  ) {
    score += 3
    signals.push("url:indeed-job")
  }

  return score
}

function scoreDom(doc: Document, signals: string[]): number {
  let score = 0

  const forms = Array.from(doc.querySelectorAll("form"))
  const inputs = Array.from(
    doc.querySelectorAll(
      "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]), textarea, select",
    ),
  )

  const fileInputs = inputs.filter(
    (el) => el instanceof HTMLInputElement && el.type === "file",
  )
  if (fileInputs.length > 0) {
    score += 3
    signals.push("dom:file-input")
    const resumeFile = fileInputs.some((el) => {
      const blob = `${el.getAttribute("name") ?? ""} ${el.getAttribute("id") ?? ""} ${el.getAttribute("accept") ?? ""}`
      return /resume|cv|pdf|doc/i.test(blob) || (el as HTMLInputElement).accept.includes("pdf")
    })
    if (resumeFile) {
      score += 2
      signals.push("dom:resume-file")
    }
  }

  let namedFields = 0
  for (const el of inputs) {
    const blob = [
      el.getAttribute("name"),
      el.getAttribute("id"),
      el.getAttribute("autocomplete"),
      el.getAttribute("placeholder"),
      el.getAttribute("aria-label"),
    ]
      .filter(Boolean)
      .join(" ")
    if (FIELD_NAME_RE.test(blob)) namedFields += 1
  }
  if (namedFields >= 3) {
    score += 3
    signals.push(`dom:apply-fields(${namedFields})`)
  } else if (namedFields >= 1) {
    score += 1
    signals.push(`dom:apply-fields(${namedFields})`)
  }

  // Multi-field forms are common on applications
  if (inputs.length >= 8) {
    score += 2
    signals.push(`dom:many-inputs(${inputs.length})`)
  } else if (inputs.length >= 4) {
    score += 1
    signals.push(`dom:some-inputs(${inputs.length})`)
  }

  if (forms.length >= 1 && inputs.length >= 3) {
    score += 1
    signals.push("dom:form-with-fields")
  }

  // Visible apply copy (bounded sample for perf)
  const sample = [
    doc.title,
    doc.body?.innerText?.slice(0, 4000) ?? "",
  ].join("\n")
  if (APPLY_TEXT_RE.test(sample)) {
    score += 2
    signals.push("dom:apply-copy")
  }

  // iframes often host Greenhouse/Lever embeds
  const iframes = Array.from(doc.querySelectorAll("iframe[src]"))
  for (const frame of iframes) {
    const src = frame.getAttribute("src") ?? ""
    try {
      const u = new URL(src, doc.baseURI)
      const ats = matchAtsHost(u.hostname)
      if (ats) {
        score += Math.min(ats.score, 5)
        signals.push(`dom:ats-iframe(${ats.site})`)
        break
      }
      if (URL_APPLY_RE.test(u.pathname)) {
        score += 3
        signals.push("dom:apply-iframe")
        break
      }
    } catch {
      /* ignore bad src */
    }
  }

  return score
}

/**
 * Score the current document + URL. Returns match when score ≥ threshold
 * and host is not MockMatch / excluded local product.
 */
export function detectApplicationPage(
  doc: Document = document,
  href: string = location.href,
): ApplicationDetection {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { match: false, reason: "invalid-url" }
  }

  if (isExcludedHost(url)) {
    return { match: false, reason: "excluded-host" }
  }

  // Extension pages / chrome internals
  if (
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.protocol === "about:" ||
    url.protocol === "chrome:"
  ) {
    return { match: false, reason: "browser-internal" }
  }

  const signals: string[] = []
  let score = 0
  let site = url.hostname.replace(/^www\./, "")

  const ats = matchAtsHost(url.hostname)
  if (ats) {
    score += ats.score
    site = ats.site
    signals.push(`host:ats(${ats.site})`)
  }

  score += scoreUrl(url, signals)
  score += scoreDom(doc, signals)

  if (score >= APPLICATION_SCORE_THRESHOLD) {
    return { match: true, score, signals, site }
  }

  return {
    match: false,
    reason: `score-below-threshold(${score}<${APPLICATION_SCORE_THRESHOLD})`,
  }
}

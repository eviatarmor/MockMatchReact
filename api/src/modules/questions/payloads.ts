/**
 * Normalize LLM / import payloads into durable question.payload shapes.
 * Pure helpers — unit-tested without OpenRouter.
 */

export type GeneratedQuestionLike = {
  title: string
  body: string
  domain: string
  difficulty: string
  format: string
  language?: string | null
  payload?: Record<string, unknown>
}

export type SpreadsheetQuestionPayload = {
  prompt: string
  durationMin?: number
  rubric?: string
  starterWorkbook?: {
    version: 1
    sheets: Array<{
      id: string
      name: string
      cells: Record<string, { raw: string }>
      rowCount: number
      colCount: number
    }>
    activeSheetId: string
  }
}

export type PageQuestionPayload = {
  prompt: string
  durationMin?: number
  rubric?: string
  starterHtml?: string
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

/** Build a valid sparse starter workbook from model JSON (or null if unusable). */
export function normalizeSpreadsheetPayload(
  item: GeneratedQuestionLike
): SpreadsheetQuestionPayload {
  const from = asRecord(item.payload)
  const prompt =
    typeof from.prompt === "string" && from.prompt.trim()
      ? from.prompt.trim()
      : item.body
  const durationMin =
    typeof from.durationMin === "number" && from.durationMin > 0
      ? Math.min(120, Math.floor(from.durationMin))
      : undefined
  const rubric =
    typeof from.rubric === "string" && from.rubric.trim()
      ? from.rubric.trim()
      : undefined

  const starter = normalizeStarterWorkbook(from.starterWorkbook ?? from.workbook)
  return {
    prompt,
    ...(durationMin !== undefined ? { durationMin } : {}),
    ...(rubric ? { rubric } : {}),
    ...(starter ? { starterWorkbook: starter } : {}),
  }
}

function normalizeStarterWorkbook(
  raw: unknown
): SpreadsheetQuestionPayload["starterWorkbook"] | null {
  const wb = asRecord(raw)
  if (!wb || Object.keys(wb).length === 0) return null

  const sheetsRaw = Array.isArray(wb.sheets) ? wb.sheets : null
  if (!sheetsRaw || sheetsRaw.length === 0) return null

  const sheets: NonNullable<
    SpreadsheetQuestionPayload["starterWorkbook"]
  >["sheets"] = []

  for (let i = 0; i < Math.min(sheetsRaw.length, 8); i++) {
    const s = asRecord(sheetsRaw[i])
    const id =
      typeof s.id === "string" && s.id.trim()
        ? s.id.trim().slice(0, 64)
        : `sheet-${i + 1}`
    const name =
      typeof s.name === "string" && s.name.trim()
        ? s.name.trim().slice(0, 80)
        : `Sheet${i + 1}`
    const cellsIn = asRecord(s.cells)
    const cells: Record<string, { raw: string }> = {}
    for (const [key, val] of Object.entries(cellsIn)) {
      if (!/^\d+:\d+$/.test(key)) continue
      if (typeof val === "string") {
        cells[key] = { raw: val }
        continue
      }
      const cell = asRecord(val)
      if (typeof cell.raw === "string") cells[key] = { raw: cell.raw }
    }
    sheets.push({
      id,
      name,
      cells,
      rowCount: clampInt(s.rowCount, 10, 500, 50),
      colCount: clampInt(s.colCount, 4, 40, 12),
    })
  }

  if (sheets.length === 0) return null
  const activeSheetId =
    typeof wb.activeSheetId === "string" &&
    sheets.some((s) => s.id === wb.activeSheetId)
      ? (wb.activeSheetId as string)
      : sheets[0]!.id

  return {
    version: 1,
    sheets,
    activeSheetId,
  }
}

export function normalizePagePayload(
  item: GeneratedQuestionLike
): PageQuestionPayload {
  const from = asRecord(item.payload)
  const prompt =
    typeof from.prompt === "string" && from.prompt.trim()
      ? from.prompt.trim()
      : item.body
  const durationMin =
    typeof from.durationMin === "number" && from.durationMin > 0
      ? Math.min(120, Math.floor(from.durationMin))
      : undefined
  const rubric =
    typeof from.rubric === "string" && from.rubric.trim()
      ? from.rubric.trim()
      : undefined

  let starterHtml: string | undefined
  if (typeof from.starterHtml === "string" && from.starterHtml.trim()) {
    starterHtml = sanitizeStarterHtml(from.starterHtml)
  } else if (typeof from.html === "string" && from.html.trim()) {
    starterHtml = sanitizeStarterHtml(from.html)
  }

  return {
    prompt,
    ...(durationMin !== undefined ? { durationMin } : {}),
    ...(rubric ? { rubric } : {}),
    ...(starterHtml ? { starterHtml } : {}),
  }
}

/** Allow a small HTML subset for starter outlines (no scripts). */
export function sanitizeStarterHtml(html: string): string {
  const trimmed = html.trim().slice(0, 50_000)
  // Strip script/style/iframe and on* handlers at a coarse level
  return trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
}

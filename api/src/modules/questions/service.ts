import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  BankQuestionDto,
  McqSession,
  McqVariant,
  QuestionDomain,
  QuestionDifficulty,
  QuestionFormat,
  QuestionMcqDetail,
  QuestionPracticeDetail,
  QuestionUserStatus,
  SubmitMcqInput,
  SubmitMcqResult,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  questions,
  type CodeRunQuestionPayload,
  type McqQuestionPayload,
  type QuestionPayload,
} from "../../db/schema/questions.js"
import { userQuestionProgress } from "../../db/schema/user-question-progress.js"

export type ListQuestionsInput = {
  search?: string
  domains?: QuestionDomain[]
  difficulties?: QuestionDifficulty[]
  formats?: QuestionFormat[]
  userStatuses?: QuestionUserStatus[]
  page?: number
  pageSize?: number
}

/** Stable track id for practice_sessions / continue-new (bank questions). */
export function questionTrackId(questionId: string): string {
  return `q:${questionId}`
}

export function parseQuestionTrackId(trackId: string): string | null {
  if (!trackId.startsWith("q:")) return null
  const id = trackId.slice(2)
  return /^[0-9a-f-]{36}$/i.test(id) ? id : null
}

const CONVERSATION_TRACKS = [
  "behavioral-core",
  "product-sense",
  "system-design-talk",
] as const

export type ConversationTrackId = (typeof CONVERSATION_TRACKS)[number]

/** Map free-form / bad model trackHint → catalog conversation track. */
export function resolveConversationTrackId(
  trackHint: string | null | undefined,
  domain?: string | null
): ConversationTrackId {
  if (
    trackHint &&
    (CONVERSATION_TRACKS as readonly string[]).includes(trackHint)
  ) {
    return trackHint as ConversationTrackId
  }
  if (domain === "product") return "product-sense"
  if (domain === "systemDesign") return "system-design-talk"
  return "behavioral-core"
}

export async function getQuestionSummary(db: Database, questionId: string) {
  const [row] = await db
    .select({
      id: questions.id,
      title: questions.title,
      format: questions.format,
      domain: questions.domain,
      difficulty: questions.difficulty,
      body: questions.body,
      payload: questions.payload,
      status: questions.status,
    })
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1)

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  // Allow draft/published so freshly generated items still open
  if (row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  const payload = (row.payload ?? {}) as { trackHint?: string }
  const trackHint = payload.trackHint ?? null
  return {
    id: row.id,
    title: row.title,
    format: row.format as QuestionFormat,
    domain: row.domain,
    difficulty: row.difficulty,
    body: row.body,
    trackHint,
    conversationTrackId:
      row.format === "conversation"
        ? resolveConversationTrackId(trackHint, row.domain)
        : null,
  }
}

export async function listQuestions(
  db: Database,
  userId: string,
  input: ListQuestionsInput = {}
): Promise<{ items: BankQuestionDto[]; total: number }> {
  const page = input.page ?? 1
  const pageSize = input.pageSize ?? 50
  const offset = (page - 1) * pageSize

  const filters = [eq(questions.status, "published")]

  if (input.domains && input.domains.length > 0) {
    filters.push(inArray(questions.domain, input.domains))
  }
  if (input.difficulties && input.difficulties.length > 0) {
    filters.push(inArray(questions.difficulty, input.difficulties))
  }
  if (input.formats && input.formats.length > 0) {
    filters.push(inArray(questions.format, input.formats))
  }
  if (input.search?.trim()) {
    const q = `%${input.search.trim()}%`
    filters.push(
      or(ilike(questions.title, q), ilike(questions.company, q))!
    )
  }

  const where = and(...filters)

  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      domain: questions.domain,
      difficulty: questions.difficulty,
      company: questions.company,
      format: questions.format,
      language: questions.language,
      body: questions.body,
      payload: questions.payload,
      userStatus: userQuestionProgress.status,
    })
    .from(questions)
    .leftJoin(
      userQuestionProgress,
      and(
        eq(userQuestionProgress.questionId, questions.id),
        eq(userQuestionProgress.userId, userId)
      )
    )
    .where(where)
    .orderBy(desc(questions.updatedAt))
    .limit(pageSize)
    .offset(offset)

  let items: BankQuestionDto[] = rows.map((r) => {
    const payload = (r.payload ?? {}) as { trackHint?: string }
    return {
      id: r.id,
      title: r.title,
      domain: r.domain,
      difficulty: r.difficulty,
      company: r.company,
      format: r.format,
      language: r.language,
      body: r.body,
      status: (r.userStatus ?? "new") as QuestionUserStatus,
      trackHint: payload.trackHint ?? null,
    }
  })

  if (input.userStatuses && input.userStatuses.length > 0) {
    const allowed = new Set(input.userStatuses)
    items = items.filter((item) => allowed.has(item.status))
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(where)

  return { items, total: count ?? 0 }
}

type TreeNode = {
  id: string
  name: string
  children?: TreeNode[]
}

function languageFromPath(path: string, fallback?: string | null): string {
  if (fallback) return fallback
  const lower = path.toLowerCase()
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript"
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "javascript"
  if (lower.endsWith(".py")) return "python"
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".h"))
    return "cpp"
  if (lower.endsWith(".java")) return "java"
  if (lower.endsWith(".json")) return "json"
  if (lower.endsWith(".md")) return "markdown"
  return "plaintext"
}

function pathsToTree(paths: string[]): TreeNode[] {
  type Mutable = { id: string; name: string; children?: Mutable[] }
  const root: Mutable[] = []

  const ensureFolder = (
    nodes: Mutable[],
    id: string,
    name: string
  ): Mutable => {
    let folder = nodes.find((n) => n.id === id)
    if (!folder) {
      folder = { id, name, children: [] }
      nodes.push(folder)
    }
    if (!folder.children) folder.children = []
    return folder
  }

  for (const raw of [...paths].sort()) {
    const path = raw.replace(/\\/g, "/").replace(/^\/+/, "")
    if (!path || path.includes("..")) continue
    const parts = path.split("/").filter(Boolean)
    let nodes = root
    let prefix = ""
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]!
      const id = prefix ? `${prefix}/${name}` : name
      const isFile = i === parts.length - 1
      if (isFile) {
        if (!nodes.some((n) => n.id === id)) nodes.push({ id, name })
      } else {
        const folder = ensureFolder(nodes, id, name)
        nodes = folder.children!
        prefix = id
      }
    }
  }
  return root as TreeNode[]
}

function resolveFileMap(
  row: {
    contentCache: Record<string, string> | null
    payload: QuestionPayload
    language: string | null
    body: string | null
  }
): Record<string, string> {
  const cache = row.contentCache ?? {}
  if (Object.keys(cache).length > 0) return { ...cache }

  const payload = row.payload as CodeRunQuestionPayload & {
    files?: Record<string, string>
  }
  if (payload.files && Object.keys(payload.files).length > 0) {
    return { ...payload.files }
  }
  if (payload.starterCode) {
    const ext =
      row.language?.includes("py")
        ? "py"
        : row.language?.includes("ts")
          ? "ts"
          : row.language?.includes("cpp")
            ? "cpp"
            : "js"
    const path = payload.entryPath || `main.${ext}`
    return { [path]: payload.starterCode }
  }
  // Minimal placeholder so IDE always has a buffer
  return {
    "README.md": row.body || payload.prompt || "Implement the solution.",
  }
}

type ParsedMcq = {
  stem: string
  options: string[]
  variant: McqVariant
  correctIndex: number | null
  correctIndices: number[] | null
  correctOrder: number[] | null
  explanation: string | null
}

function asIndexList(
  raw: unknown,
  optionCount: number
): number[] | null {
  if (!Array.isArray(raw)) return null
  const nums = raw
    .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
    .filter((n) => n >= 0 && n < optionCount)
  if (nums.length === 0) return null
  return nums
}

function parseMcqPayload(
  payload: QuestionPayload | null | undefined,
  body: string | null
): ParsedMcq {
  const p = (payload ?? {}) as Partial<McqQuestionPayload> & Record<string, unknown>
  const options = Array.isArray(p.options)
    ? p.options
        .map((o) => (typeof o === "string" ? o.trim() : String(o ?? "").trim()))
        .filter((o) => o.length > 0)
        .slice(0, 6)
    : []
  if (options.length < 2) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ question is missing options",
    })
  }

  const rawVariant = p.variant
  let variant: McqVariant =
    rawVariant === "multi" || rawVariant === "order" || rawVariant === "single"
      ? rawVariant
      : "single"

  // Infer variant from payload shape when omitted
  if (p.variant == null) {
    if (Array.isArray(p.correctOrder)) variant = "order"
    else if (Array.isArray(p.correctIndices)) variant = "multi"
    else variant = "single"
  }

  let correctIndex: number | null = null
  let correctIndices: number[] | null = null
  let correctOrder: number[] | null = null

  if (variant === "single") {
    const idx =
      typeof p.correctIndex === "number" && Number.isInteger(p.correctIndex)
        ? p.correctIndex
        : -1
    if (idx < 0 || idx >= options.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "MCQ question has invalid correct answer",
      })
    }
    correctIndex = idx
  } else if (variant === "multi") {
    const list = asIndexList(p.correctIndices, options.length)
    if (!list || list.length === 0) {
      // Fallback: single correctIndex treated as multi
      if (
        typeof p.correctIndex === "number" &&
        Number.isInteger(p.correctIndex) &&
        p.correctIndex >= 0 &&
        p.correctIndex < options.length
      ) {
        correctIndices = [p.correctIndex]
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MCQ multi question is missing correctIndices",
        })
      }
    } else {
      correctIndices = [...new Set(list)].sort((a, b) => a - b)
    }
  } else {
    const list = asIndexList(p.correctOrder, options.length)
    if (!list || list.length !== options.length) {
      // Default identity order if options already listed correctly
      if (list == null && options.length >= 2) {
        correctOrder = options.map((_, i) => i)
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MCQ order question needs a full correctOrder permutation",
        })
      }
    } else {
      const sorted = [...list].sort((a, b) => a - b)
      const identity = options.map((_, i) => i)
      const isPerm =
        sorted.length === identity.length &&
        sorted.every((v, i) => v === identity[i])
      if (!isPerm) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MCQ correctOrder must be a permutation of option indices",
        })
      }
      correctOrder = list
    }
  }

  const stem =
    typeof p.stem === "string" && p.stem.trim()
      ? p.stem.trim()
      : body?.trim() || ""
  if (!stem) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ question is missing a stem",
    })
  }
  const explanation =
    typeof p.explanation === "string" && p.explanation.trim()
      ? p.explanation.trim()
      : null
  return {
    stem,
    options,
    variant,
    correctIndex,
    correctIndices,
    correctOrder,
    explanation,
  }
}

function toMcqDetail(row: {
  id: string
  title: string
  domain: string
  difficulty: string
  company: string | null
  body: string | null
  payload: QuestionPayload | null
}): QuestionMcqDetail {
  const { stem, options, variant } = parseMcqPayload(row.payload, row.body)
  return {
    id: row.id,
    title: row.title,
    format: "mcq",
    domain: row.domain as QuestionDomain,
    difficulty: row.difficulty as QuestionDifficulty,
    company: row.company,
    stem,
    options,
    variant,
  }
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

/**
 * Bank MCQ → stem + options (no answer until submit).
 */
export async function getQuestionForMcq(
  db: Database,
  questionId: string
): Promise<QuestionMcqDetail> {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!row || row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  if (row.format !== "mcq") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Question is not an MCQ",
    })
  }
  return toMcqDetail(row)
}

/**
 * Same-domain MCQ pack: seed first, then more published MCQs in that domain.
 */
export async function getMcqSession(
  db: Database,
  seedId: string,
  limit = 8
): Promise<McqSession> {
  const seed = await db.query.questions.findFirst({
    where: eq(questions.id, seedId),
  })
  if (!seed || seed.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  if (seed.format !== "mcq") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Question is not an MCQ",
    })
  }

  const cap = Math.min(Math.max(limit, 1), 20)
  const peers = await db
    .select({
      id: questions.id,
      title: questions.title,
      domain: questions.domain,
      difficulty: questions.difficulty,
      company: questions.company,
      body: questions.body,
      payload: questions.payload,
    })
    .from(questions)
    .where(
      and(
        eq(questions.format, "mcq"),
        eq(questions.domain, seed.domain),
        eq(questions.status, "published"),
        ne(questions.id, seed.id)
      )
    )
    .orderBy(desc(questions.updatedAt))
    .limit(cap - 1)

  const items: QuestionMcqDetail[] = [toMcqDetail(seed)]
  for (const peer of peers) {
    try {
      items.push(toMcqDetail(peer))
    } catch {
      // Skip malformed peers
    }
  }

  return {
    seedId: seed.id,
    domain: seed.domain as QuestionDomain,
    questions: items,
  }
}

/**
 * Grade MCQ selection (single / multi / order), update per-user progress.
 * Correct → mastered; incorrect → attempted (never demotes mastered).
 */
export async function submitMcqAnswer(
  db: Database,
  userId: string,
  questionId: string,
  answer: Pick<
    SubmitMcqInput,
    "selectedIndex" | "selectedIndices" | "orderedIndices"
  >
): Promise<SubmitMcqResult> {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!row || row.status === "archived") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }
  if (row.format !== "mcq") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Question is not an MCQ",
    })
  }

  const parsed = parseMcqPayload(row.payload, row.body)
  const { options, variant, explanation } = parsed
  let correct = false

  if (variant === "single") {
    const selectedIndex = answer.selectedIndex
    if (
      selectedIndex === undefined ||
      selectedIndex < 0 ||
      selectedIndex >= options.length
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid selected option",
      })
    }
    correct = selectedIndex === parsed.correctIndex
  } else if (variant === "multi") {
    const selected = answer.selectedIndices
    if (!selected || selected.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Select at least one option",
      })
    }
    if (selected.some((i) => i < 0 || i >= options.length)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid selected options",
      })
    }
    const a = [...new Set(selected)].sort((x, y) => x - y)
    const b = parsed.correctIndices ?? []
    correct = arraysEqual(a, b)
  } else {
    const ordered = answer.orderedIndices
    if (!ordered || ordered.length !== options.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ordered answer must include every option once",
      })
    }
    if (ordered.some((i) => i < 0 || i >= options.length)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid ordered indices",
      })
    }
    const sorted = [...ordered].sort((x, y) => x - y)
    const identity = options.map((_, i) => i)
    if (!arraysEqual(sorted, identity)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Ordered answer must be a full permutation",
      })
    }
    correct = arraysEqual(ordered, parsed.correctOrder ?? identity)
  }

  const nextStatus: QuestionUserStatus = correct ? "mastered" : "attempted"
  const now = new Date()

  const [existing] = await db
    .select({
      status: userQuestionProgress.status,
      attemptCount: userQuestionProgress.attemptCount,
    })
    .from(userQuestionProgress)
    .where(
      and(
        eq(userQuestionProgress.userId, userId),
        eq(userQuestionProgress.questionId, questionId)
      )
    )
    .limit(1)

  const prevStatus = existing?.status as QuestionUserStatus | undefined
  const status: QuestionUserStatus =
    prevStatus === "mastered" ? "mastered" : nextStatus
  const attemptCount = (existing?.attemptCount ?? 0) + 1

  await db
    .insert(userQuestionProgress)
    .values({
      userId,
      questionId,
      status,
      attemptCount,
      lastAttemptAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userQuestionProgress.userId, userQuestionProgress.questionId],
      set: {
        status,
        attemptCount,
        lastAttemptAt: now,
        updatedAt: now,
      },
    })

  return {
    correct,
    variant,
    correctIndex: parsed.correctIndex,
    correctIndices: parsed.correctIndices,
    correctOrder: parsed.correctOrder,
    explanation,
    status,
  }
}

/**
 * Bank question → IDE document + chrome flags.
 * Source of truth for generated code_run / workspace / terminal items.
 */
export async function getQuestionForPractice(
  db: Database,
  questionId: string
): Promise<QuestionPracticeDetail> {
  const row = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  })
  if (!row || row.status !== "published") {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Question not found",
    })
  }

  if (row.format === "conversation") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Conversation questions open in voice, not the IDE",
    })
  }
  if (row.format === "mcq") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "MCQ questions open in the MCQ practice surface, not the IDE",
    })
  }
  if (row.format === "whiteboard") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Whiteboard questions open in the whiteboard practice surface, not the IDE",
    })
  }

  const payload = (row.payload ?? {}) as CodeRunQuestionPayload & {
    trackHint?: string
    interviewerPrompt?: string
  }
  const fileMap = resolveFileMap({
    contentCache: row.contentCache,
    payload: row.payload,
    language: row.language,
    body: row.body,
  })
  const paths = Object.keys(fileMap)
  const tree =
    paths.length === 1
      ? [{ id: paths[0]!, name: paths[0]!.split("/").pop() || paths[0]! }]
      : pathsToTree(paths)

  const documentFiles: QuestionPracticeDetail["document"]["files"] = {}
  for (const [path, content] of Object.entries(fileMap)) {
    documentFiles[path] = {
      content,
      language: languageFromPath(path, row.language),
    }
  }

  const multiFile = paths.length > 1 || row.format === "workspace"
  const entryPath =
    payload.entryPath ||
    paths.find((p) => /main\./.test(p)) ||
    paths[0]

  return {
    id: row.id,
    title: row.title,
    format: row.format as QuestionFormat,
    domain: row.domain,
    difficulty: row.difficulty,
    language: row.language,
    body: row.body,
    prompt: payload.prompt || row.body || "",
    trackHint: payload.trackHint ?? null,
    trackId: questionTrackId(row.id),
    document: {
      tree,
      files: documentFiles,
    },
    uiFlags: {
      treeEnabled: multiFile,
      defaultShowTree: multiFile,
      defaultShowTerminal: true,
      openSeedTabs: true,
      tabsClosable: multiFile,
      tests: payload.tests,
      entryPath,
      runtimeLanguage: row.language ?? undefined,
    },
  }
}

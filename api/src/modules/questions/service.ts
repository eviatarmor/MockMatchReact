import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import type {
  BankQuestionDto,
  QuestionDomain,
  QuestionDifficulty,
  QuestionFormat,
  QuestionPracticeDetail,
  QuestionUserStatus,
} from "@mockmatch/schemas"
import type { Database } from "../../db/client.js"
import {
  questions,
  type CodeRunQuestionPayload,
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

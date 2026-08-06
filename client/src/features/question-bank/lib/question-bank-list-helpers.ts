import type {
  BankQuestion,
  QuestionDomain,
  QuestionDifficulty,
  QuestionStatus,
} from "../types"

/** List row shape from `questions.list` before mapping to `BankQuestion`. */
export type ListQuestionItem = {
  readonly id: string
  readonly title: string
  readonly domain: QuestionDomain
  readonly difficulty: QuestionDifficulty
  readonly company: string | null
  readonly status: QuestionStatus
  readonly format?: BankQuestion["format"]
  readonly trackHint?: string | null
}

export type QuestionBankListFilters = {
  readonly search: string
  readonly selectedDomains: ReadonlySet<QuestionDomain>
  readonly selectedDifficulties: ReadonlySet<QuestionDifficulty>
  readonly selectedStatuses: ReadonlySet<QuestionStatus>
}

export function toggleSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

function optionalFromSet<T>(set: ReadonlySet<T>): T[] | undefined {
  if (set.size === 0) return undefined
  return Array.from(set)
}

/** Build `questions.list` input from local filter UI state. */
export function buildListQueryInput(filters: QuestionBankListFilters) {
  const trimmed = filters.search.trim()
  return {
    search: trimmed || undefined,
    domains: optionalFromSet(filters.selectedDomains) as
      | QuestionDomain[]
      | undefined,
    difficulties: optionalFromSet(filters.selectedDifficulties) as
      | QuestionDifficulty[]
      | undefined,
    userStatuses: optionalFromSet(filters.selectedStatuses) as
      | QuestionStatus[]
      | undefined,
    page: 1 as const,
    pageSize: 100 as const,
  }
}

export function mapListItemsToBankQuestions(
  items: readonly ListQuestionItem[] | undefined
): BankQuestion[] {
  if (!items) return []
  return items.map((q) => ({
    id: q.id,
    title: q.title,
    domain: q.domain,
    difficulty: q.difficulty,
    company: q.company,
    status: q.status,
    format: q.format,
    trackHint: q.trackHint,
  }))
}

export function countByField<K extends string>(
  questions: readonly BankQuestion[],
  field: (q: BankQuestion) => K
): Partial<Record<K, number>> {
  const counts: Partial<Record<K, number>> = {}
  for (const q of questions) {
    const key = field(q)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export function computeHasFilters(filters: QuestionBankListFilters): boolean {
  if (filters.selectedDomains.size > 0) return true
  if (filters.selectedDifficulties.size > 0) return true
  if (filters.selectedStatuses.size > 0) return true
  return Boolean(filters.search.trim())
}

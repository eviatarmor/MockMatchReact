import { useMemo, useState } from "react"
import { trpc } from "@/lib/trpc"
import type {
  BankQuestion,
  QuestionDomain,
  QuestionDifficulty,
  QuestionStatus,
} from "../types"

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

/**
 * Shared list + filter state for Question Bank and Interview tracks browse.
 * Both surfaces read the same global `questions.list` bank.
 */
export function useQuestionBankList(options?: { customOnly?: boolean }) {
  const [search, setSearch] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<Set<QuestionDomain>>(
    new Set()
  )
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Set<QuestionDifficulty>
  >(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<QuestionStatus>>(
    new Set()
  )
  const [customOnly, setCustomOnly] = useState(Boolean(options?.customOnly))

  const listQuery = trpc.questions.list.useQuery({
    search: search.trim() || undefined,
    domains:
      selectedDomains.size > 0
        ? (Array.from(selectedDomains) as QuestionDomain[])
        : undefined,
    difficulties:
      selectedDifficulties.size > 0
        ? (Array.from(selectedDifficulties) as QuestionDifficulty[])
        : undefined,
    userStatuses:
      selectedStatuses.size > 0
        ? (Array.from(selectedStatuses) as QuestionStatus[])
        : undefined,
    customOnly: customOnly || undefined,
    page: 1,
    pageSize: 100,
  })

  const questions: BankQuestion[] = useMemo(
    () =>
      (listQuery.data?.items ?? []).map((q) => ({
        id: q.id,
        title: q.title,
        domain: q.domain,
        difficulty: q.difficulty,
        company: q.company,
        status: q.status,
        format: q.format,
        trackHint: q.trackHint,
        isCustom: q.isCustom,
      })),
    [listQuery.data?.items]
  )

  const total = listQuery.data?.total ?? questions.length

  const domainCounts = useMemo(() => {
    const counts: Partial<Record<QuestionDomain, number>> = {}
    for (const q of questions) {
      counts[q.domain] = (counts[q.domain] ?? 0) + 1
    }
    return counts
  }, [questions])

  const difficultyCounts = useMemo(() => {
    const counts: Partial<Record<QuestionDifficulty, number>> = {}
    for (const q of questions) {
      counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1
    }
    return counts
  }, [questions])

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<QuestionStatus, number>> = {}
    for (const q of questions) {
      counts[q.status] = (counts[q.status] ?? 0) + 1
    }
    return counts
  }, [questions])

  const hasFilters =
    selectedDomains.size > 0 ||
    selectedDifficulties.size > 0 ||
    selectedStatuses.size > 0 ||
    customOnly ||
    Boolean(search.trim())

  return {
    search,
    setSearch,
    selectedDomains,
    selectedDifficulties,
    selectedStatuses,
    customOnly,
    setCustomOnly,
    onDomainToggle: (d: QuestionDomain) =>
      setSelectedDomains((prev) => toggleSet(prev, d)),
    onDifficultyToggle: (d: QuestionDifficulty) =>
      setSelectedDifficulties((prev) => toggleSet(prev, d)),
    onStatusToggle: (s: QuestionStatus) =>
      setSelectedStatuses((prev) => toggleSet(prev, s)),
    questions,
    total,
    domainCounts,
    difficultyCounts,
    statusCounts,
    hasFilters,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    isEmpty: !listQuery.isLoading && questions.length === 0,
  }
}

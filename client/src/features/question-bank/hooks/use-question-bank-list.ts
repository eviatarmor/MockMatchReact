import { useMemo, useState } from "react"
import { trpc } from "@/lib/trpc"
import type {
  QuestionDomain,
  QuestionDifficulty,
  QuestionStatus,
} from "../types"
import {
  buildListQueryInput,
  computeHasFilters,
  countByField,
  mapListItemsToBankQuestions,
  toggleSet,
} from "../lib/question-bank-list-helpers"

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

  const filters = useMemo(
    () => ({
      search,
      selectedDomains,
      selectedDifficulties,
      selectedStatuses,
      customOnly,
    }),
    [
      search,
      selectedDomains,
      selectedDifficulties,
      selectedStatuses,
      customOnly,
    ]
  )

  const listQuery = trpc.questions.list.useQuery(buildListQueryInput(filters))

  const questions = useMemo(
    () => mapListItemsToBankQuestions(listQuery.data?.items),
    [listQuery.data?.items]
  )

  const total = listQuery.data?.total ?? questions.length

  const domainCounts = useMemo(
    () => countByField(questions, (q) => q.domain),
    [questions]
  )
  const difficultyCounts = useMemo(
    () => countByField(questions, (q) => q.difficulty),
    [questions]
  )
  const statusCounts = useMemo(
    () => countByField(questions, (q) => q.status),
    [questions]
  )

  const hasFilters = computeHasFilters(filters)

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

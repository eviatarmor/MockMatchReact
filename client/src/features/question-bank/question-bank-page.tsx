import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bookmark } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { trpc } from "@/lib/trpc"
import { QuestionBankFilters } from "./components/question-bank-filters"
import { QuestionBankTable } from "./components/question-bank-table"
import type {
  BankQuestion,
  QuestionDomain,
  QuestionDifficulty,
  QuestionStatus,
} from "./types"

export function QuestionBankPageContent() {
  const { t } = useTranslation("common")
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
    page: 1,
    pageSize: 100,
  })

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    setter(next)
  }

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
      })),
    [listQuery.data?.items]
  )

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
    Boolean(search.trim())

  const emptyState = (
    <EntityEmptyState
      icon={Bookmark}
      title={
        hasFilters
          ? t("questionBank.noResults")
          : t("questionBank.emptyTitle", {
              defaultValue: "No questions yet",
            })
      }
      description={
        hasFilters
          ? t("questionBank.emptySearchDescription", {
              defaultValue: "Try different filters or search terms.",
            })
          : t("questionBank.emptyDescription", {
              defaultValue:
                "Apply to a job in Discover or import a job in Applications — questions generate automatically into this bank.",
            })
      }
    />
  )

  return (
    <DashboardPageShell title={t("questionBank.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("questionBank.title")}
          description={t("questionBank.description")}
        />

        <div className="flex flex-1 items-start gap-4 min-h-0">
          <aside className="sticky top-[10px] hidden w-44 shrink-0 self-start lg:block">
            <QuestionBankFilters
              selectedDomains={selectedDomains}
              selectedDifficulties={selectedDifficulties}
              selectedStatuses={selectedStatuses}
              onDomainToggle={(d) =>
                toggle(selectedDomains, d, setSelectedDomains)
              }
              onDifficultyToggle={(d) =>
                toggle(selectedDifficulties, d, setSelectedDifficulties)
              }
              onStatusToggle={(s) =>
                toggle(selectedStatuses, s, setSelectedStatuses)
              }
              domainCounts={domainCounts}
              difficultyCounts={difficultyCounts}
              statusCounts={statusCounts}
            />
          </aside>

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <TableToolbar
              searchPlaceholder={t("questionBank.searchPlaceholder")}
              search={search}
              onSearchChange={setSearch}
              searchClassName="max-w-full sm:max-w-xs"
              actions={
                <Button
                  variant="outline"
                  className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
                >
                  <Bookmark className="size-4" />
                  <span className="hidden sm:inline">
                    {t("questionBank.actions.saved")}
                  </span>
                </Button>
              }
            />
            <EntityListStates
              isError={listQuery.isError}
              isLoading={listQuery.isLoading}
              isEmpty={!listQuery.isLoading && questions.length === 0}
              errorMessage={t("questionBank.loadError", {
                defaultValue: "Could not load questions.",
              })}
              loadingMessage={t("questionBank.loading", {
                defaultValue: "Loading questions…",
              })}
              emptyState={emptyState}
            >
              <QuestionBankTable questions={questions} />
            </EntityListStates>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}

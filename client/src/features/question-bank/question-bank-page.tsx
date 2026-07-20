import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Bookmark, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { QuestionBankFilters } from "./components/question-bank-filters"
import { QuestionBankTable } from "./components/question-bank-table"
import { MOCK_QUESTIONS } from "./constants"
import type { QuestionDomain, QuestionDifficulty, QuestionStatus } from "./types"

export function QuestionBankPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")
  const [selectedDomains, setSelectedDomains] = useState<Set<QuestionDomain>>(new Set())
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<QuestionDifficulty>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<Set<QuestionStatus>>(new Set())

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  const filtered = useMemo(
    () =>
      MOCK_QUESTIONS.filter((q) => {
        const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase())
        const matchesDomain = selectedDomains.size === 0 || selectedDomains.has(q.domain)
        const matchesDifficulty = selectedDifficulties.size === 0 || selectedDifficulties.has(q.difficulty)
        const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(q.status)
        return matchesSearch && matchesDomain && matchesDifficulty && matchesStatus
      }),
    [search, selectedDomains, selectedDifficulties, selectedStatuses]
  )

  return (
    <DashboardPageShell title={t("questionBank.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("questionBank.title")}
          description={t("questionBank.description")}
        />

        <div className="flex flex-1 items-start gap-4 min-h-0">
          {/* Sticky vs DashboardLayout ScrollArea; top offset keeps filters off the card edge. */}
          <aside className="sticky top-[10px] hidden w-44 shrink-0 self-start lg:block">
            <QuestionBankFilters
              selectedDomains={selectedDomains}
              selectedDifficulties={selectedDifficulties}
              selectedStatuses={selectedStatuses}
              onDomainToggle={(d) => toggle(selectedDomains, d, setSelectedDomains)}
              onDifficultyToggle={(d) => toggle(selectedDifficulties, d, setSelectedDifficulties)}
              onStatusToggle={(s) => toggle(selectedStatuses, s, setSelectedStatuses)}
            />
          </aside>

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <TableToolbar
              searchPlaceholder={t("questionBank.searchPlaceholder")}
              search={search}
              onSearchChange={setSearch}
              searchClassName="max-w-full sm:max-w-xs"
              actions={
                <>
                  <Button variant="outline" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer">
                    <Bookmark className="size-4" />
                    <span className="hidden sm:inline">{t("questionBank.actions.saved")}</span>
                  </Button>
                  <Button variant="default" className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">{t("questionBank.actions.newPracticeSet")}</span>
                  </Button>
                </>
              }
            />
            <QuestionBankTable questions={filtered} />
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}

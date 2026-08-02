import { ArrowLeft, Bookmark } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { QuestionBankFilters } from "@/features/question-bank/components/question-bank-filters"
import { QuestionBankTable } from "@/features/question-bank/components/question-bank-table"
import { useQuestionBankList } from "@/features/question-bank/hooks/use-question-bank-list"

export function SimulationTracksPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const list = useQuestionBankList()

  const emptyState = (
    <EntityEmptyState
      icon={Bookmark}
      title={
        list.hasFilters
          ? t("simulations.tracksBrowser.noResults")
          : t("questionBank.emptyTitle", {
              defaultValue: "No questions yet",
            })
      }
      description={
        list.hasFilters
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
    <DashboardPageShell title={t("simulations.tracksBrowser.browseTitle")}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate("/simulations")}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("simulations.tracksBrowser.browseBackLink")}
          </button>
          <DashboardPageHeader
            title={t("simulations.tracksBrowser.browseTitle")}
            description={t("simulations.tracksBrowser.browseDescription", {
              count: list.total,
            })}
          />
        </div>

        <div className="flex flex-1 items-start gap-4 min-h-0">
          <aside className="sticky top-[10px] hidden w-44 shrink-0 self-start lg:block">
            <QuestionBankFilters
              selectedDomains={list.selectedDomains}
              selectedDifficulties={list.selectedDifficulties}
              selectedStatuses={list.selectedStatuses}
              onDomainToggle={list.onDomainToggle}
              onDifficultyToggle={list.onDifficultyToggle}
              onStatusToggle={list.onStatusToggle}
              domainCounts={list.domainCounts}
              difficultyCounts={list.difficultyCounts}
              statusCounts={list.statusCounts}
            />
          </aside>

          <div className="flex flex-1 flex-col gap-3 min-w-0">
            <TableToolbar
              searchPlaceholder={t("simulations.tracksBrowser.searchPlaceholder")}
              search={list.search}
              onSearchChange={list.setSearch}
              searchClassName="max-w-full sm:max-w-xs"
            />
            <EntityListStates
              isError={list.isError}
              isLoading={list.isLoading}
              isEmpty={list.isEmpty}
              errorMessage={t("questionBank.loadError", {
                defaultValue: "Could not load questions.",
              })}
              loadingMessage={t("questionBank.loading", {
                defaultValue: "Loading questions…",
              })}
              emptyState={emptyState}
            >
              <QuestionBankTable questions={list.questions} />
            </EntityListStates>
          </div>
        </div>
      </div>
    </DashboardPageShell>
  )
}

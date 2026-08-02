import { useTranslation } from "react-i18next"
import { Bookmark } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { QuestionBankFilters } from "./components/question-bank-filters"
import { QuestionBankTable } from "./components/question-bank-table"
import { useQuestionBankList } from "./hooks/use-question-bank-list"

export function QuestionBankPageContent() {
  const { t } = useTranslation("common")
  const list = useQuestionBankList()

  const emptyState = (
    <EntityEmptyState
      icon={Bookmark}
      title={
        list.hasFilters
          ? t("questionBank.noResults")
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
    <DashboardPageShell title={t("questionBank.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("questionBank.title")}
          description={t("questionBank.description")}
        />

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
              searchPlaceholder={t("questionBank.searchPlaceholder")}
              search={list.search}
              onSearchChange={list.setSearch}
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

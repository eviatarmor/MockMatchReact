import { useTranslation } from "react-i18next"
import { Plus, Play } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { DifficultyBadge } from "@/components/data/difficulty-badge"
import { QuestionStatusBadge } from "./question-status-badge"
import type { BankQuestion } from "../types"

interface QuestionBankTableProps {
  readonly questions: readonly BankQuestion[]
}

export function QuestionBankTable({ questions }: QuestionBankTableProps) {
  const { t } = useTranslation("common")

  const columns: EntityTableColumn[] = [
    { key: "question", label: t("questionBank.columns.question") },
    { key: "domain", label: t("questionBank.columns.domain") },
    { key: "difficulty", label: t("questionBank.columns.difficulty") },
    { key: "status", label: t("questionBank.columns.status") },
    { key: "action", label: t("questionBank.columns.action"), className: "text-right" },
  ]

  return (
    <EntityTable
      columns={columns}
      isEmpty={questions.length === 0}
      emptyMessage={t("questionBank.noResults")}
    >
      {questions.map((q) => (
        <tr
          key={q.id}
          className="group border-b border-border/40 transition-colors hover:bg-muted/5"
        >
          <td className="px-4 py-3 text-sm font-medium transition-colors group-hover:text-primary">
            {q.title}
          </td>
          <td className="px-4 py-3 text-sm text-muted-foreground">
            {t(`questionBank.domains.${q.domain}`)}
          </td>
          <td className="px-4 py-3">
            <DifficultyBadge difficulty={q.difficulty} translationPrefix="questionBank.difficulty" />
          </td>
          <td className="px-4 py-3">
            <QuestionStatusBadge status={q.status} />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 cursor-pointer"
                aria-label={t("questionBank.actions.save")}
              >
                <Plus className="size-3.5" />
              </Button>
              <Button variant="ghost" className="h-7 cursor-pointer gap-1.5 px-2 text-xs">
                <Play className="size-3" />
                {t("questionBank.actions.practice")}
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </EntityTable>
  )
}

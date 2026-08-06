import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Play, Rocket } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { Spinner } from "@mockmatch/ui/spinner"
import { EntityTable, type EntityTableColumn } from "@/components/data/entity-table"
import { DifficultyBadge } from "@/components/data/difficulty-badge"
import { practicePathForBankQuestion } from "@/features/simulations/lib/practice-path"
import { formatLabelKey } from "../constants"
import type { CustomQuestionRow } from "../types"

interface MyQuestionsTableProps {
  readonly items: readonly CustomQuestionRow[]
  readonly deployingId: string | null
  readonly onDeploySelf: (id: string) => void
}

export function MyQuestionsTable({
  items,
  deployingId,
  onDeploySelf,
}: MyQuestionsTableProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()

  const columns: EntityTableColumn[] = [
    { key: "question", label: t("customQuestions.columns.question") },
    { key: "format", label: t("customQuestions.columns.format") },
    { key: "domain", label: t("customQuestions.columns.domain") },
    { key: "difficulty", label: t("customQuestions.columns.difficulty") },
    { key: "status", label: t("customQuestions.columns.status") },
    {
      key: "action",
      label: t("customQuestions.columns.action"),
      className: "text-right",
    },
  ]

  return (
    <EntityTable
      columns={columns}
      isEmpty={items.length === 0}
      emptyMessage={t("customQuestions.mine.emptyTitle")}
    >
      {items.map((q) => {
        const isDraft = q.publishStatus === "draft"
        const isPublished = q.publishStatus === "published"
        const practicePath = practicePathForBankQuestion({
          id: q.id,
          format: q.format,
        })
        const deploying = deployingId === q.id

        return (
          <tr
            key={q.id}
            className="group border-b border-border/40 transition-colors hover:bg-muted/5"
          >
            <td className="px-4 py-3 text-sm font-medium transition-colors group-hover:text-primary">
              {q.title}
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline" className="px-1.5 py-0 text-2xs font-normal">
                {t(`simulations.format.${formatLabelKey(q.format)}`)}
              </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
              {t(`questionBank.domains.${q.domain}`)}
            </td>
            <td className="px-4 py-3">
              <DifficultyBadge
                difficulty={q.difficulty}
                translationPrefix="questionBank.difficulty"
              />
            </td>
            <td className="px-4 py-3">
              <Badge
                variant={isPublished ? "default" : "secondary"}
                className="px-1.5 py-0 text-2xs font-normal"
              >
                {t(`customQuestions.publishStatus.${q.publishStatus}`)}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                {isDraft ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
                    disabled={deploying}
                    onClick={() => onDeploySelf(q.id)}
                  >
                    {deploying ? (
                      <Spinner className="size-3" />
                    ) : (
                      <Rocket className="size-3" />
                    )}
                    {t("customQuestions.actions.deploySelf")}
                  </Button>
                ) : null}
                {isPublished && practicePath ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
                    onClick={() => navigate(practicePath)}
                  >
                    <Play className="size-3" />
                    {t("customQuestions.actions.practice")}
                  </Button>
                ) : null}
              </div>
            </td>
          </tr>
        )
      })}
    </EntityTable>
  )
}

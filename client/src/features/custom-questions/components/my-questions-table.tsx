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

function DeployButton({
  id,
  deploying,
  onDeploySelf,
}: {
  readonly id: string
  readonly deploying: boolean
  readonly onDeploySelf: (id: string) => void
}) {
  const { t } = useTranslation("common")
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
      disabled={deploying}
      onClick={() => onDeploySelf(id)}
    >
      {deploying ? <Spinner className="size-3" /> : <Rocket className="size-3" />}
      {t("customQuestions.actions.deploySelf")}
    </Button>
  )
}

function PracticeButton({ path }: { readonly path: string }) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 cursor-pointer gap-1.5 px-2 text-xs"
      onClick={() => navigate(path)}
    >
      <Play className="size-3" />
      {t("customQuestions.actions.practice")}
    </Button>
  )
}

function RowActions({
  q,
  deploying,
  onDeploySelf,
}: {
  readonly q: CustomQuestionRow
  readonly deploying: boolean
  readonly onDeploySelf: (id: string) => void
}) {
  if (q.publishStatus === "draft") {
    return (
      <div className="flex items-center justify-end gap-2">
        <DeployButton
          id={q.id}
          deploying={deploying}
          onDeploySelf={onDeploySelf}
        />
      </div>
    )
  }

  const practicePath = practicePathForBankQuestion({
    id: q.id,
    format: q.format,
  })
  if (!practicePath) return null

  return (
    <div className="flex items-center justify-end gap-2">
      <PracticeButton path={practicePath} />
    </div>
  )
}

function MyQuestionRow({
  q,
  deployingId,
  onDeploySelf,
}: {
  readonly q: CustomQuestionRow
  readonly deployingId: string | null
  readonly onDeploySelf: (id: string) => void
}) {
  const { t } = useTranslation("common")
  const statusVariant =
    q.publishStatus === "published" ? "default" : "secondary"

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
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
          variant={statusVariant}
          className="px-1.5 py-0 text-2xs font-normal"
        >
          {t(`customQuestions.publishStatus.${q.publishStatus}`)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <RowActions
          q={q}
          deploying={deployingId === q.id}
          onDeploySelf={onDeploySelf}
        />
      </td>
    </tr>
  )
}

export function MyQuestionsTable({
  items,
  deployingId,
  onDeploySelf,
}: MyQuestionsTableProps) {
  const { t } = useTranslation("common")

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
      {items.map((q) => (
        <MyQuestionRow
          key={q.id}
          q={q}
          deployingId={deployingId}
          onDeploySelf={onDeploySelf}
        />
      ))}
    </EntityTable>
  )
}

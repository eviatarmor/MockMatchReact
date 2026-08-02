import {
  AlignJustify,
  Code2,
  MessageSquare,
  Monitor,
  Terminal,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@mockmatch/ui/button"
import { Badge } from "@mockmatch/ui/badge"
import { DifficultyBadge } from "@/components/data/difficulty-badge"
import type { BankQuestion, QuestionFormat } from "@/features/question-bank/types"
import { practicePathForBankQuestion } from "../lib/practice-path"

function formatIcon(format: QuestionFormat | undefined) {
  switch (format) {
    case "conversation":
      return MessageSquare
    case "workspace":
      return Monitor
    case "terminal":
      return Terminal
    case "code_run":
      return Code2
    default:
      return AlignJustify
  }
}

/** Map bank format enum → simulations.format.* i18n key (camelCase). */
function formatLabelKey(format: QuestionFormat | undefined): string | null {
  if (!format) return null
  if (format === "code_run") return "codeRun"
  if (format === "workspace") return "workspace"
  if (format === "terminal") return "terminal"
  if (format === "conversation") return "conversation"
  return null
}

interface SimulationTrackCardProps {
  readonly question: BankQuestion
}

export function SimulationTrackCard({ question }: SimulationTrackCardProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const Icon = formatIcon(question.format)
  const practicePath = practicePathForBankQuestion(question)
  const formatKey = formatLabelKey(question.format)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
        <DifficultyBadge
          difficulty={question.difficulty}
          translationPrefix="questionBank.difficulty"
        />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          {question.title}
        </h3>
        <p className="text-xs leading-snug text-muted-foreground">
          {t(`questionBank.domains.${question.domain}`)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {formatKey ? (
          <Badge variant="outline" className="px-1.5 py-0 text-2xs font-normal">
            {t(`simulations.format.${formatKey}`)}
          </Badge>
        ) : null}
        <span className="text-2xs text-muted-foreground">
          {t(`questionBank.status.${question.status}`)}
        </span>
      </div>

      <Button
        variant="default"
        className="h-8 w-full cursor-pointer gap-2"
        disabled={!practicePath}
        onClick={() => {
          if (practicePath) navigate(practicePath)
        }}
      >
        {t("simulations.startPractice")}
      </Button>
    </div>
  )
}

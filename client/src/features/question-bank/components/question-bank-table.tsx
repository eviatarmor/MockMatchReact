import { useTranslation } from "react-i18next"
import { Plus, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QuestionDifficultyBadge } from "./question-difficulty-badge"
import { QuestionStatusBadge } from "./question-status-badge"
import type { BankQuestion } from "../types"

interface QuestionBankTableProps {
  readonly questions: readonly BankQuestion[]
  readonly total: number
}

export function QuestionBankTable({ questions, total }: QuestionBankTableProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{total}</span> {t("questionBank.questionsCount")}
        </span>
      </div>

      <ScrollArea className="w-full rounded-xl border bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
              <th className="py-3 px-4 font-bold">{t("questionBank.columns.question")}</th>
              <th className="py-3 px-4 font-bold">{t("questionBank.columns.domain")}</th>
              <th className="py-3 px-4 font-bold">{t("questionBank.columns.difficulty")}</th>
              <th className="py-3 px-4 font-bold hidden md:table-cell">{t("questionBank.columns.company")}</th>
              <th className="py-3 px-4 font-bold">{t("questionBank.columns.status")}</th>
              <th className="py-3 px-4 font-bold text-right">{t("questionBank.columns.action")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {questions.length > 0 ? (
              questions.map((q) => (
                <tr key={q.id} className="group hover:bg-muted/5 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium group-hover:text-primary transition-colors">
                    {q.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-primary">
                    {t(`questionBank.domains.${q.domain}`)}
                  </td>
                  <td className="py-3 px-4">
                    <QuestionDifficultyBadge difficulty={q.difficulty} />
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">
                    {q.company ?? "—"}
                  </td>
                  <td className="py-3 px-4">
                    <QuestionStatusBadge status={q.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" aria-label={t("questionBank.actions.save")}>
                        <Plus className="size-3.5" />
                      </Button>
                      <Button variant="ghost" className="h-7 gap-1.5 px-2 text-xs cursor-pointer">
                        <Play className="size-3" />
                        {t("questionBank.actions.practice")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {t("questionBank.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  )
}

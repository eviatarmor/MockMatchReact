import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { MOCK_QUESTIONS, QUESTION_DOMAINS, QUESTION_DIFFICULTIES, QUESTION_STATUSES } from "../constants"
import type { QuestionDomain, QuestionDifficulty, QuestionStatus } from "../types"

function countByDomain(domain: QuestionDomain) {
  return MOCK_QUESTIONS.filter((q) => q.domain === domain).length
}
function countByDifficulty(d: QuestionDifficulty) {
  return MOCK_QUESTIONS.filter((q) => q.difficulty === d).length
}
function countByStatus(s: QuestionStatus) {
  return MOCK_QUESTIONS.filter((q) => q.status === s).length
}

interface QuestionBankFiltersProps {
  readonly selectedDomains: Set<QuestionDomain>
  readonly selectedDifficulties: Set<QuestionDifficulty>
  readonly selectedStatuses: Set<QuestionStatus>
  readonly onDomainToggle: (d: QuestionDomain) => void
  readonly onDifficultyToggle: (d: QuestionDifficulty) => void
  readonly onStatusToggle: (s: QuestionStatus) => void
}

export function QuestionBankFilters({
  selectedDomains,
  selectedDifficulties,
  selectedStatuses,
  onDomainToggle,
  onDifficultyToggle,
  onStatusToggle,
}: QuestionBankFiltersProps) {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-5">
      <span className="text-sm font-semibold">{t("questionBank.filters.title")}</span>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("questionBank.filters.domain")}
        </p>
        {QUESTION_DOMAINS.map((d) => (
          <label key={d} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedDomains.has(d)} onCheckedChange={() => onDomainToggle(d)} />
              <span className="text-sm">{t(`questionBank.domains.${d}`)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{countByDomain(d)}</span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("questionBank.filters.difficulty")}
        </p>
        {QUESTION_DIFFICULTIES.map((d) => (
          <label key={d} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedDifficulties.has(d)} onCheckedChange={() => onDifficultyToggle(d)} />
              <span className="text-sm">{t(`questionBank.difficulty.${d}`)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{countByDifficulty(d)}</span>
          </label>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("questionBank.filters.status")}
        </p>
        {QUESTION_STATUSES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedStatuses.has(s)} onCheckedChange={() => onStatusToggle(s)} />
              <span className="text-sm">{t(`questionBank.status.${s}`)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{countByStatus(s)}</span>
          </label>
        ))}
      </section>
    </div>
  )
}

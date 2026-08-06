import { useTranslation } from "react-i18next"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import { Textarea } from "@mockmatch/ui/textarea"
import { DIFFICULTIES, DOMAINS } from "../constants"
import type {
  CreateCustomFormState,
  QuestionDifficulty,
  QuestionDomain,
} from "../types"
import { FieldSelect } from "./field-select"

function promptLabelKey(format: CreateCustomFormState["format"]): string {
  if (format === "mcq") return "customQuestions.fields.stem"
  if (format === "conversation") return "customQuestions.fields.interviewerPrompt"
  return "customQuestions.fields.prompt"
}

interface CreateFormMetaFieldsProps {
  readonly form: CreateCustomFormState
  readonly isPending: boolean
  readonly onField: <K extends keyof CreateCustomFormState>(
    key: K,
    value: CreateCustomFormState[K]
  ) => void
}

export function CreateFormMetaFields({
  form,
  isPending,
  onField,
}: CreateFormMetaFieldsProps) {
  const { t } = useTranslation("common")
  const domainItems = DOMAINS.map((d) => ({
    value: d,
    label: t(`questionBank.domains.${d}`),
  }))
  const difficultyItems = DIFFICULTIES.map((d) => ({
    value: d,
    label: t(`questionBank.difficulty.${d}`),
  }))

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="cq-title">{t("customQuestions.fields.title")}</Label>
        <Input
          id="cq-title"
          value={form.title}
          onChange={(e) => onField("title", e.target.value)}
          placeholder={t("customQuestions.fields.titlePlaceholder")}
          maxLength={300}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cq-domain">{t("customQuestions.fields.domain")}</Label>
        <FieldSelect<QuestionDomain>
          id="cq-domain"
          value={form.domain}
          onChange={(v) => onField("domain", v)}
          items={domainItems}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cq-difficulty">
          {t("customQuestions.fields.difficulty")}
        </Label>
        <FieldSelect<QuestionDifficulty>
          id="cq-difficulty"
          value={form.difficulty}
          onChange={(v) => onField("difficulty", v)}
          items={difficultyItems}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="cq-company">
          {t("customQuestions.fields.company")}
        </Label>
        <Input
          id="cq-company"
          value={form.company}
          onChange={(e) => onField("company", e.target.value)}
          placeholder={t("customQuestions.fields.companyPlaceholder")}
          maxLength={200}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="cq-prompt">{t(promptLabelKey(form.format))}</Label>
        <Textarea
          id="cq-prompt"
          value={form.prompt}
          onChange={(e) => onField("prompt", e.target.value)}
          placeholder={t("customQuestions.fields.promptPlaceholder")}
          rows={4}
          maxLength={8000}
          disabled={isPending}
          className="min-h-24 resize-y"
        />
      </div>
    </>
  )
}

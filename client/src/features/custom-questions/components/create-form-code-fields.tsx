import { useTranslation } from "react-i18next"
import { Label } from "@mockmatch/ui/label"
import { Textarea } from "@mockmatch/ui/textarea"
import { CODE_LANGUAGES } from "../constants"
import type { CreateCustomFormState } from "../types"
import { FieldSelect } from "./field-select"

interface CreateFormCodeFieldsProps {
  readonly form: CreateCustomFormState
  readonly isPending: boolean
  readonly onField: <K extends keyof CreateCustomFormState>(
    key: K,
    value: CreateCustomFormState[K]
  ) => void
}

export function CreateFormCodeFields({
  form,
  isPending,
  onField,
}: CreateFormCodeFieldsProps) {
  const { t } = useTranslation("common")
  const languageItems = CODE_LANGUAGES.map((l) => ({
    value: l,
    label: t(`customQuestions.languages.${l}`, { defaultValue: l }),
  }))

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cq-language">
          {t("customQuestions.fields.language")}
        </Label>
        <FieldSelect<string>
          id="cq-language"
          value={form.language}
          onChange={(v) => onField("language", v)}
          items={languageItems}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="cq-starter">
          {t("customQuestions.fields.starterCode")}
        </Label>
        <Textarea
          id="cq-starter"
          value={form.starterCode}
          onChange={(e) => onField("starterCode", e.target.value)}
          placeholder={t("customQuestions.fields.starterCodePlaceholder")}
          rows={6}
          disabled={isPending}
          className="min-h-32 resize-y font-mono text-xs"
        />
      </div>
    </>
  )
}

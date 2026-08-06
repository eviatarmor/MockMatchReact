import type { FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { Spinner } from "@mockmatch/ui/spinner"
import { canSubmitCreate, formatLabelKey } from "../constants"
import type { CreateFormFieldHandlers } from "../types"
import { CreateFormFormatFields } from "./create-form-format-fields"
import { CreateFormMetaFields } from "./create-form-meta-fields"

interface CreateCustomFormProps extends CreateFormFieldHandlers {
  readonly onSubmit: () => void
}

function CreateSubmitButton({
  canSubmit,
  isPending,
}: {
  readonly canSubmit: boolean
  readonly isPending: boolean
}) {
  const { t } = useTranslation("common")
  return (
    <Button
      type="submit"
      className="cursor-pointer gap-1.5"
      disabled={!canSubmit}
    >
      {isPending ? <Spinner className="size-3.5" /> : null}
      {isPending
        ? t("customQuestions.actions.creating")
        : t("customQuestions.actions.createDraft")}
    </Button>
  )
}

export function CreateCustomForm({
  form,
  isPending,
  onField,
  onOption,
  onAddOption,
  onRemoveOption,
  onToggleCorrect,
  onSubmit,
}: CreateCustomFormProps) {
  const { t } = useTranslation("common")
  const formatLabel = t(
    `simulations.format.${formatLabelKey(form.format)}`
  )
  const canSubmit = canSubmitCreate(form) && !isPending

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit()
  }

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">
          {t("customQuestions.create.title", { format: formatLabel })}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("customQuestions.create.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CreateFormMetaFields
          form={form}
          isPending={isPending}
          onField={onField}
        />
        <CreateFormFormatFields
          form={form}
          isPending={isPending}
          onField={onField}
          onOption={onOption}
          onAddOption={onAddOption}
          onRemoveOption={onRemoveOption}
          onToggleCorrect={onToggleCorrect}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
        <p className="text-xs text-muted-foreground">
          {t("customQuestions.create.deployNote")}
        </p>
        <CreateSubmitButton canSubmit={canSubmit} isPending={isPending} />
      </div>
    </form>
  )
}

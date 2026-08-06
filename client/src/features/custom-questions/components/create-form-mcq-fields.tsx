import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import { Checkbox } from "@mockmatch/ui/checkbox"
import { MCQ_VARIANTS } from "../constants"
import type { CreateCustomFormState, CreateFormFieldHandlers, McqVariant } from "../types"
import { FieldSelect } from "./field-select"

function isOptionCorrect(
  form: CreateCustomFormState,
  index: number
): boolean {
  if (form.mcqVariant === "multi") return form.correctIndices.includes(index)
  return form.correctIndex === index
}

function McqOptionRow({
  form,
  index,
  opt,
  isPending,
  onOption,
  onRemoveOption,
  onToggleCorrect,
}: {
  readonly form: CreateCustomFormState
  readonly index: number
  readonly opt: string
  readonly isPending: boolean
  readonly onOption: (index: number, value: string) => void
  readonly onRemoveOption: (index: number) => void
  readonly onToggleCorrect: (index: number) => void
}) {
  const { t } = useTranslation("common")
  const correct = isOptionCorrect(form, index)
  const showCheckbox = form.mcqVariant !== "order"
  const canRemove = !isPending && form.options.length > 2

  return (
    <div className="flex items-center gap-2">
      {showCheckbox ? (
        <Checkbox
          checked={correct}
          onCheckedChange={() => onToggleCorrect(index)}
          aria-label={t("customQuestions.fields.markCorrect", {
            n: index + 1,
          })}
          disabled={isPending}
        />
      ) : (
        <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
          {index + 1}
        </span>
      )}
      <Input
        value={opt}
        onChange={(e) => onOption(index, e.target.value)}
        placeholder={t("customQuestions.fields.optionPlaceholder", {
          n: index + 1,
        })}
        disabled={isPending}
        className="flex-1"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 cursor-pointer"
        disabled={!canRemove}
        onClick={() => onRemoveOption(index)}
        aria-label={t("customQuestions.fields.removeOption")}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}

function McqOptionsList(props: CreateFormFieldHandlers) {
  const { t } = useTranslation("common")
  const { form, isPending, onOption, onAddOption, onRemoveOption, onToggleCorrect } =
    props
  const canAdd = form.options.length < 6
  const hintKey =
    form.mcqVariant === "order"
      ? "customQuestions.fields.orderHint"
      : "customQuestions.fields.correctHint"

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("customQuestions.fields.options")}</Label>
      {form.options.map((opt, index) => (
        <McqOptionRow
          key={index}
          form={form}
          index={index}
          opt={opt}
          isPending={isPending}
          onOption={onOption}
          onRemoveOption={onRemoveOption}
          onToggleCorrect={onToggleCorrect}
        />
      ))}
      {canAdd ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit cursor-pointer gap-1.5"
          onClick={onAddOption}
          disabled={isPending}
        >
          <Plus className="size-3.5" />
          {t("customQuestions.fields.addOption")}
        </Button>
      ) : null}
      <p className="text-xs text-muted-foreground">{t(hintKey)}</p>
    </div>
  )
}

export function CreateFormMcqFields(props: CreateFormFieldHandlers) {
  const { t } = useTranslation("common")
  const { form, onField } = props
  const mcqVariantItems = MCQ_VARIANTS.map((v) => ({
    value: v,
    label: t(`customQuestions.mcqVariant.${v}`),
  }))

  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cq-mcq-variant">
          {t("customQuestions.fields.mcqVariant")}
        </Label>
        <FieldSelect<McqVariant>
          id="cq-mcq-variant"
          value={form.mcqVariant}
          onChange={(v) => onField("mcqVariant", v)}
          items={mcqVariantItems}
        />
      </div>
      <McqOptionsList {...props} />
    </div>
  )
}

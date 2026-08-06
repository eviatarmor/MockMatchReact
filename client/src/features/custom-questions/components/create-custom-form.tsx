import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import { Textarea } from "@mockmatch/ui/textarea"
import { Spinner } from "@mockmatch/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import { Checkbox } from "@mockmatch/ui/checkbox"
import {
  CODE_LANGUAGES,
  CONVERSATION_TRACKS,
  DIFFICULTIES,
  DOMAINS,
  MCQ_VARIANTS,
  canSubmitCreate,
  formatLabelKey,
} from "../constants"
import type {
  ConversationTrackHint,
  CreateCustomFormState,
  McqVariant,
  QuestionDifficulty,
  QuestionDomain,
} from "../types"

interface CreateCustomFormProps {
  readonly form: CreateCustomFormState
  readonly isPending: boolean
  readonly onField: <K extends keyof CreateCustomFormState>(
    key: K,
    value: CreateCustomFormState[K]
  ) => void
  readonly onOption: (index: number, value: string) => void
  readonly onAddOption: () => void
  readonly onRemoveOption: (index: number) => void
  readonly onToggleCorrect: (index: number) => void
  readonly onSubmit: () => void
}

function FieldSelect<TValue extends string>({
  id,
  value,
  onChange,
  items,
}: {
  readonly id: string
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly items: readonly { value: TValue; label: string }[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as TValue)}
      items={items.map((i) => ({ value: i.value, label: i.label }))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const isCodeLike =
    form.format === "code_run" ||
    form.format === "workspace" ||
    form.format === "terminal"
  const canSubmit = canSubmitCreate(form) && !isPending

  const domainItems = DOMAINS.map((d) => ({
    value: d,
    label: t(`questionBank.domains.${d}`),
  }))
  const difficultyItems = DIFFICULTIES.map((d) => ({
    value: d,
    label: t(`questionBank.difficulty.${d}`),
  }))
  const languageItems = CODE_LANGUAGES.map((l) => ({
    value: l,
    label: t(`customQuestions.languages.${l}`, { defaultValue: l }),
  }))
  const mcqVariantItems = MCQ_VARIANTS.map((v) => ({
    value: v,
    label: t(`customQuestions.mcqVariant.${v}`),
  }))
  const trackItems = [
    {
      value: "auto" as const,
      label: t("customQuestions.fields.trackHintAuto"),
    },
    ...CONVERSATION_TRACKS.map((tr) => ({
      value: tr,
      label: t(`customQuestions.tracks.${tr}`),
    })),
  ]

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit()
      }}
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
          <Label htmlFor="cq-domain">
            {t("customQuestions.fields.domain")}
          </Label>
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
          <Label htmlFor="cq-prompt">
            {form.format === "mcq"
              ? t("customQuestions.fields.stem")
              : form.format === "conversation"
                ? t("customQuestions.fields.interviewerPrompt")
                : t("customQuestions.fields.prompt")}
          </Label>
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

        {isCodeLike ? (
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
        ) : null}

        {form.format === "conversation" ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cq-track">
              {t("customQuestions.fields.trackHint")}
            </Label>
            <FieldSelect<ConversationTrackHint | "auto">
              id="cq-track"
              value={form.trackHint}
              onChange={(v) => onField("trackHint", v)}
              items={trackItems}
            />
          </div>
        ) : null}

        {form.format === "mcq" ? (
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

            <div className="flex flex-col gap-2">
              <Label>{t("customQuestions.fields.options")}</Label>
              {form.options.map((opt, index) => {
                const isCorrect =
                  form.mcqVariant === "multi"
                    ? form.correctIndices.includes(index)
                    : form.correctIndex === index
                return (
                  <div key={index} className="flex items-center gap-2">
                    {form.mcqVariant !== "order" ? (
                      <Checkbox
                        checked={isCorrect}
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
                      disabled={isPending || form.options.length <= 2}
                      onClick={() => onRemoveOption(index)}
                      aria-label={t("customQuestions.fields.removeOption")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
              {form.options.length < 6 ? (
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
              {form.mcqVariant === "order" ? (
                <p className="text-xs text-muted-foreground">
                  {t("customQuestions.fields.orderHint")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("customQuestions.fields.correctHint")}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
        <p className="text-xs text-muted-foreground">
          {t("customQuestions.create.deployNote")}
        </p>
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
      </div>
    </form>
  )
}

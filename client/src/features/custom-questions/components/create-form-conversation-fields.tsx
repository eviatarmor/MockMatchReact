import { useTranslation } from "react-i18next"
import { Label } from "@mockmatch/ui/label"
import { CONVERSATION_TRACKS } from "../constants"
import type { ConversationTrackHint, CreateCustomFormState } from "../types"
import { FieldSelect } from "./field-select"

interface CreateFormConversationFieldsProps {
  readonly form: CreateCustomFormState
  readonly onField: <K extends keyof CreateCustomFormState>(
    key: K,
    value: CreateCustomFormState[K]
  ) => void
}

export function CreateFormConversationFields({
  form,
  onField,
}: CreateFormConversationFieldsProps) {
  const { t } = useTranslation("common")
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
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <Label htmlFor="cq-track">{t("customQuestions.fields.trackHint")}</Label>
      <FieldSelect<ConversationTrackHint | "auto">
        id="cq-track"
        value={form.trackHint}
        onChange={(v) => onField("trackHint", v)}
        items={trackItems}
      />
    </div>
  )
}

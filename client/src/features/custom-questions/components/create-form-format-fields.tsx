import { isCodeLikeFormat } from "../constants"
import type { CreateFormFieldHandlers } from "../types"
import { CreateFormCodeFields } from "./create-form-code-fields"
import { CreateFormConversationFields } from "./create-form-conversation-fields"
import { CreateFormMcqFields } from "./create-form-mcq-fields"

/** Format-specific create fields (code / conversation / MCQ). */
export function CreateFormFormatFields({
  form,
  isPending,
  onField,
  onOption,
  onAddOption,
  onRemoveOption,
  onToggleCorrect,
}: CreateFormFieldHandlers) {
  if (isCodeLikeFormat(form.format)) {
    return (
      <CreateFormCodeFields
        form={form}
        isPending={isPending}
        onField={onField}
      />
    )
  }
  if (form.format === "conversation") {
    return <CreateFormConversationFields form={form} onField={onField} />
  }
  if (form.format === "mcq") {
    return (
      <CreateFormMcqFields
        form={form}
        isPending={isPending}
        onField={onField}
        onOption={onOption}
        onAddOption={onAddOption}
        onRemoveOption={onRemoveOption}
        onToggleCorrect={onToggleCorrect}
      />
    )
  }
  return null
}

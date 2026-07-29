import { useTranslation } from "react-i18next"
import { CheckIcon, XIcon } from "lucide-react"
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@mockmatch/ai-chat/ai-elements/confirmation"
import { useDocumentAssistant } from "../document-assistant-context"
import type { ReplaceDocumentTextToolUIPart } from "../lib/replace-tool"

type ReplaceConfirmationProps = {
  readonly part: ReplaceDocumentTextToolUIPart
  readonly onApprove: (approvalId: string) => void
  readonly onReject: (approvalId: string) => void
}

export function ReplaceConfirmation({
  part,
  onApprove,
  onReject,
}: ReplaceConfirmationProps) {
  const { t } = useTranslation()
  const { i18nNs, applyTextReplacement } = useDocumentAssistant()
  const input = part.input
  const location =
    input?.locationLabel?.trim() ||
    input?.targetId?.trim() ||
    t(`${i18nNs}:ai.replace.somewhere`)

  if (!part.approval) return null

  const handleApprove = () => {
    if (input?.find != null && applyTextReplacement) {
      applyTextReplacement({
        find: input.find,
        replacement: input.replacement ?? "",
        targetId: input.targetId,
      })
    }
    onApprove(part.approval!.id)
  }

  return (
    <Confirmation
      approval={part.approval}
      state={part.state}
      className="mt-2 border-border bg-muted/40 text-foreground"
    >
      <ConfirmationRequest>
        <ConfirmationTitle className="text-sm text-foreground">
          {t(`${i18nNs}:ai.replace.requestTitle`, { location })}
        </ConfirmationTitle>
        <div className="mt-2 space-y-2 text-xs">
          <div>
            <p className="mb-0.5 font-medium text-muted-foreground">
              {t(`${i18nNs}:ai.replace.current`)}
            </p>
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-border/60 bg-background/80 p-2 font-sans text-[12px] leading-relaxed text-foreground">
              {input?.find || "—"}
            </pre>
          </div>
          <div>
            <p className="mb-0.5 font-medium text-muted-foreground">
              {t(`${i18nNs}:ai.replace.proposed`)}
            </p>
            <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-primary/20 bg-primary/5 p-2 font-sans text-[12px] leading-relaxed text-foreground">
              {input?.replacement || "—"}
            </pre>
          </div>
        </div>
      </ConfirmationRequest>

      <ConfirmationAccepted>
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <CheckIcon className="size-4 text-emerald-600" />
          <span>{t(`${i18nNs}:ai.replace.accepted`)}</span>
        </div>
      </ConfirmationAccepted>

      <ConfirmationRejected>
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <XIcon className="size-4 text-destructive" />
          <span>{t(`${i18nNs}:ai.replace.rejected`)}</span>
        </div>
      </ConfirmationRejected>

      <ConfirmationActions>
        <ConfirmationAction
          variant="outline"
          className="cursor-pointer"
          onClick={() => onReject(part.approval!.id)}
        >
          {t(`${i18nNs}:ai.replace.reject`)}
        </ConfirmationAction>
        <ConfirmationAction
          variant="default"
          className="cursor-pointer"
          onClick={handleApprove}
          disabled={!applyTextReplacement}
        >
          {t(`${i18nNs}:ai.replace.approve`)}
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  )
}

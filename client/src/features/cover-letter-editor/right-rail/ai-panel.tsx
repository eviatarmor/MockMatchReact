import { useTranslation } from "react-i18next"
import { Wand2, Scissors, Target, SpellCheck, ArrowUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const AI_ACTIONS = [
  { id: "improve", icon: Wand2 },
  { id: "shorten", icon: Scissors },
  { id: "tailor", icon: Target },
  { id: "grammar", icon: SpellCheck },
] as const

/** AI assistant actions + free-form prompt (presentational scaffold). */
export function AiPanel() {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {AI_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              className="flex cursor-pointer flex-col items-start gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/60"
            >
              <Icon className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{t(`ai.actions.${action.id}`)}</span>
            </button>
          )
        })}
      </div>

      <div className="relative">
        <Textarea
          placeholder={t("ai.promptPlaceholder")}
          className="min-h-24 resize-none pr-11"
        />
        <button
          type="button"
          className="absolute bottom-2.5 right-2.5 flex size-7 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          aria-label={t("ai.send")}
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </div>
  )
}

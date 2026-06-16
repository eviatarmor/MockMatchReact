import { useTranslation } from "react-i18next"
import { Controller, type UseFormReturn } from "react-hook-form"
import { motion } from "motion/react"
import { Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { SectionShell } from "@/features/account-settings/right-pane/section-shell"
import { VOICE_OPTIONS } from "@/features/account-settings/constants"
import type { AccountSettingsForm, VoiceProfile } from "@/features/account-settings/types"

const BARS = [0.4, 0.8, 0.5, 1, 0.6]

function Equalizer({ active }: { readonly active: boolean }) {
  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden>
      {BARS.map((peak, index) => (
        <motion.span
          key={index}
          className={cn("w-0.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")}
          animate={active ? { height: [`${peak * 30}%`, "100%", `${peak * 30}%`] } : { height: "30%" }}
          transition={active ? { duration: 0.9, repeat: Infinity, delay: index * 0.1, ease: "easeInOut" } : undefined}
        />
      ))}
    </div>
  )
}

interface VoiceSectionProps {
  readonly form: UseFormReturn<AccountSettingsForm>
}

export function VoiceSection({ form }: VoiceSectionProps) {
  const { t } = useTranslation("account-settings")

  const previewVoice = (name: string) => {
    toast(t("toast.voicePreviewTitle", { voice: name }), {
      description: t("toast.voicePreviewDescription"),
    })
  }

  return (
    <SectionShell heading={t("voice.heading")} description={t("voice.description")}>
      <Controller
        control={form.control}
        name="voiceProfile"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={(value) => field.onChange(value as VoiceProfile)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {VOICE_OPTIONS.map((option) => {
              const selected = field.value === option.value
              const name = t(option.nameKey)
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3 ring-1 transition-colors",
                    selected ? "ring-2 ring-primary" : "ring-foreground/10 hover:ring-primary"
                  )}
                >
                  <RadioGroupItem value={option.value} className="shrink-0" />
                  <Equalizer active={selected} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t(option.localeKey)} · {t(option.genderKey)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{t(option.descriptionKey)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 cursor-pointer"
                    onClick={(event) => {
                      event.preventDefault()
                      previewVoice(name)
                    }}
                  >
                    <Play className="size-3.5" />
                    {t("voice.preview")}
                  </Button>
                </label>
              )
            })}
          </RadioGroup>
        )}
      />
    </SectionShell>
  )
}

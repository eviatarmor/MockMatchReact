import { useTranslation } from "react-i18next"
import { AudioWaveform, Check, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const INTEGRATIONS = [
  { id: "zoom",   labelKey: "recorder.banner.zoom" },
  { id: "meet",   labelKey: "recorder.banner.meet" },
  { id: "teams",  labelKey: "recorder.banner.teams" },
  { id: "cal",    labelKey: "recorder.banner.calendar" },
] as const

const STEPS = [
  { n: 1, titleKey: "recorder.steps.join.title",    descKey: "recorder.steps.join.desc" },
  { n: 2, titleKey: "recorder.steps.consent.title", descKey: "recorder.steps.consent.desc" },
  { n: 3, titleKey: "recorder.steps.insights.title",descKey: "recorder.steps.insights.desc" },
] as const

export function RecorderBanner() {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-0 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <AudioWaveform className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold">{t("recorder.banner.name")}</span>
              <Badge variant="default">
                {t("recorder.banner.status")}
              </Badge>
              <span className="text-xs text-muted-foreground">v1.6.0</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">{t("recorder.banner.description")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEGRATIONS.map((i) => (
                <Badge key={i.id} variant="default">
                  <Check className="size-3" />
                  {t(i.labelKey)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button className="cursor-pointer">
            <Check className="size-4" />
            {t("recorder.banner.connected")}
          </Button>
          <Button variant="outline" className="cursor-pointer">
            {t("recorder.banner.manage")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y border-t bg-muted/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map((step) => (
          <div key={step.n} className="flex items-start gap-3 px-5 py-3">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground mt-0.5">
              {step.n}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t(step.titleKey)}</span>
              <span className="text-xs text-muted-foreground">{t(step.descKey)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 border-t px-5 py-3 bg-muted/10">
        <Shield className="size-4 shrink-0 text-muted-foreground mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{t("recorder.consent.title")}</span>
          <span className="text-xs text-muted-foreground">{t("recorder.consent.description")}</span>
        </div>
      </div>
    </div>
  )
}

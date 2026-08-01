import { useTranslation } from "react-i18next"
import { AudioWaveform, Check, Shield } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"

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
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <AudioWaveform className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-foreground">{t("recorder.banner.name")}</span>
              <Badge variant="secondary">
                {t("recorder.banner.status")}
              </Badge>
              <span className="text-xs text-muted-foreground">v1.6.0</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">{t("recorder.banner.description")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEGRATIONS.map((i) => (
                <Badge key={i.id} variant="secondary">
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

      <div className="grid grid-cols-1 divide-y border-t border-border/60 bg-muted/30 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map((step) => (
          <div key={step.n} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-semibold text-primary-foreground">
              {step.n}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{t(step.titleKey)}</span>
              <span className="text-xs text-muted-foreground">{t(step.descKey)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 border-t border-border/60 bg-muted/20 px-5 py-3">
        <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{t("recorder.consent.title")}</span>
          <span className="text-xs text-muted-foreground">{t("recorder.consent.description")}</span>
        </div>
      </div>
    </div>
  )
}

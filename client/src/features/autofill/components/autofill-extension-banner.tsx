import { useTranslation } from "react-i18next"
import { Zap, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BADGE_TONES } from "@/components/data/badge-tones"

const BROWSERS = [
  { id: "chrome",  labelKey: "autofill.extension.chrome",  active: true  },
  { id: "edge",    labelKey: "autofill.extension.edge",    active: true  },
  { id: "brave",   labelKey: "autofill.extension.brave",   active: true  },
  { id: "firefox", labelKey: "autofill.extension.firefox", active: false },
] as const

const STEPS = [
  { n: 1, titleKey: "autofill.steps.open.title",   descKey: "autofill.steps.open.desc"   },
  { n: 2, titleKey: "autofill.steps.click.title",  descKey: "autofill.steps.click.desc"  },
  { n: 3, titleKey: "autofill.steps.review.title", descKey: "autofill.steps.review.desc" },
] as const

export function AutofillExtensionBanner() {
  const { t } = useTranslation("common")

  return (
    <div className="flex flex-col gap-0 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold">{t("autofill.extension.name")}</span>
              <Badge variant="outline" className={BADGE_TONES.emerald}>
                {t("autofill.extension.status")}
              </Badge>
              <span className="text-xs text-muted-foreground">v2.4.1</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">{t("autofill.extension.description")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BROWSERS.map((b) => (
                <span
                  key={b.id}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                    b.active
                      ? BADGE_TONES.emerald
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {b.active && <Check className="size-3" />}
                  {t(b.labelKey)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button className="h-8 gap-1.5 cursor-pointer">
            <Check className="size-4" />
            {t("autofill.extension.addedToChrome")}
          </Button>
          <Button variant="outline" className="h-8 gap-1.5 cursor-pointer">
            {t("autofill.extension.manage")}
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
    </div>
  )
}

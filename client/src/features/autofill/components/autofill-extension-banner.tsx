import { useTranslation } from "react-i18next"
import { Zap, Check } from "lucide-react"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"

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
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Zap className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-foreground">{t("autofill.extension.name")}</span>
              <Badge variant="secondary">
                {t("autofill.extension.status")}
              </Badge>
              <span className="text-xs text-muted-foreground">v2.4.1</span>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">{t("autofill.extension.description")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {BROWSERS.map((b) => (
                <Badge key={b.id} variant={b.active ? "secondary" : "outline"}>
                  {b.active && <Check className="size-3" />}
                  {t(b.labelKey)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <Button className="cursor-pointer">
            <Check className="size-4" />
            {t("autofill.extension.addedToChrome")}
          </Button>
          <Button variant="outline" className="cursor-pointer">
            {t("autofill.extension.manage")}
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
    </div>
  )
}

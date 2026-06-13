import { BadgeCheck, CheckCircle2, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { FeatureHighlightList } from "@/features/login/left-pane/feature-highlight-list"
import { ReadinessSummaryCard } from "@/features/login/left-pane/readiness-summary-card"
import { FEATURE_HIGHLIGHTS, READINESS_SUMMARY } from "@/features/login/constants"

export function LoginHeroPanel() {
  const { t } = useTranslation(["common", "login"])

  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]"
      />
      <div className="relative flex w-full max-w-md flex-1 flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white text-primary">
            <CheckCircle2 className="size-5" />
          </span>
          <span className="text-lg font-semibold">{t("common:appName")}</span>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
              <Sparkles className="size-3.5" />
              {t("common:heroHeadline.eyebrow")}
            </span>
            <h1 className="text-4xl font-bold leading-tight">{t("common:heroHeadline.title")}</h1>
            <p className="text-white/80">{t("common:heroHeadline.description")}</p>
          </div>

          <FeatureHighlightList features={FEATURE_HIGHLIGHTS} />

          <ReadinessSummaryCard summary={READINESS_SUMMARY} />
        </div>

        <p className="flex items-center gap-1.5 text-sm text-white/70">
          <BadgeCheck className="size-4 shrink-0" />
          {t("login:trustMessage")}
        </p>
      </div>
    </div>
  )
}

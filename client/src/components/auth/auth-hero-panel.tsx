import { BadgeCheck, Sparkles, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { AppLogo } from "@/components/icons/app-logo"
import { InteractiveGridPattern } from "@mockmatch/ui/interactive-grid-pattern"
import { FeatureHighlightList } from "@/features/login/left-pane/feature-highlight-list"
import { ReadinessSummaryCard } from "@/features/login/left-pane/readiness-summary-card"
import { FEATURE_HIGHLIGHTS, READINESS_SUMMARY } from "@/features/login/constants"
import { cn } from "@/lib/utils"

interface AuthHeroPanelProps {
  readonly trustMessageKey?: string
  readonly bottomSlot?: ReactNode
  readonly eyebrowIcon?: LucideIcon
  readonly eyebrowKey?: string
  readonly titleKey?: string
  readonly descriptionKey?: string
  readonly middleSlot?: ReactNode
}

export function AuthHeroPanel({
  trustMessageKey,
  bottomSlot,
  eyebrowIcon: EyebrowIcon = Sparkles,
  eyebrowKey = "common:heroHeadline.eyebrow",
  titleKey = "common:heroHeadline.title",
  descriptionKey = "common:heroHeadline.description",
  middleSlot,
}: AuthHeroPanelProps) {
  const { t } = useTranslation(["common", "login"])

  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
      {/* z-0 + full-panel hit target; content below uses pointer-events-none so hover reaches cells */}
      <InteractiveGridPattern
        aria-hidden="true"
        width={20}
        height={20}
        squares={[80, 80]}
        className={cn(
          "z-0 border-0",
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
        squaresClassName="hover:fill-blue-500"
      />
      <div className="pointer-events-none relative z-10 flex w-full max-w-md flex-1 flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1">
            <AppLogo className="size-full" />
          </span>
          <span className="text-lg font-semibold">{t("common:appName")}</span>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
              <EyebrowIcon className="size-3.5" />
              {t(eyebrowKey)}
            </span>
            <h1 className="text-4xl font-bold leading-tight">{t(titleKey)}</h1>
            <p className="text-white/80">{t(descriptionKey)}</p>
          </div>

          {middleSlot ?? (
            <>
              <FeatureHighlightList features={FEATURE_HIGHLIGHTS} />
              <ReadinessSummaryCard summary={READINESS_SUMMARY} />
            </>
          )}
        </div>

        {bottomSlot ?? (
          <p className="flex items-center gap-1.5 text-sm text-white/70">
            <BadgeCheck className="size-4 shrink-0" />
            {trustMessageKey && t(trustMessageKey)}
          </p>
        )}
      </div>
    </div>
  )
}

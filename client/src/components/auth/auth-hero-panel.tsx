import { BadgeCheck } from "lucide-react"
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
  readonly titleKey?: string
  readonly descriptionKey?: string
  /**
   * Middle stack under the headline.
   * `undefined` → login defaults (features + readiness).
   * `null` → empty (e.g. 404).
   * Otherwise render the provided node.
   */
  readonly middleSlot?: ReactNode | null
}

/**
 * Persuade-side auth column: Prep Ultramarine field, interactive grid, logo, headline, proof.
 */
export function AuthHeroPanel({
  trustMessageKey,
  bottomSlot,
  titleKey = "common:heroHeadline.title",
  descriptionKey = "common:heroHeadline.description",
  middleSlot,
}: AuthHeroPanelProps) {
  const { t } = useTranslation(["common", "login", "not-found"])

  const middle =
    middleSlot === undefined ? (
      <>
        <FeatureHighlightList features={FEATURE_HIGHLIGHTS} />
        <ReadinessSummaryCard summary={READINESS_SUMMARY} />
      </>
    ) : (
      middleSlot
    )

  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
      {/* Content under the grid so cells receive hover (transparent fills keep copy visible). */}
      {/* 32×32 + CSS-only hover — denser grids re-render too hard on pointer move. */}
      <div className="relative z-0 flex w-full max-w-md flex-1 flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1">
            <AppLogo className="size-full" />
          </span>
          <span className="text-lg font-semibold">{t("common:appName")}</span>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance">
              {t(titleKey)}
            </h1>
            <p className="max-w-prose text-base text-primary-foreground/80 text-pretty">
              {t(descriptionKey)}
            </p>
          </div>

          {middle}
        </div>

        {bottomSlot ?? (
          <p className="flex items-center gap-1.5 text-sm text-primary-foreground/70">
            <BadgeCheck className="size-4 shrink-0" aria-hidden />
            {trustMessageKey ? t(trustMessageKey) : null}
          </p>
        )}
      </div>

      {/* z-10 hit layer on top; white/20 shows on primary. */}
      <InteractiveGridPattern
        aria-hidden="true"
        width={28}
        height={28}
        squares={[32, 32]}
        className={cn(
          "pointer-events-auto z-10 border-0",
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
        )}
        squaresClassName="hover:fill-white/20"
      />
    </div>
  )
}

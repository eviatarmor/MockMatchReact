import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { BlurFade } from "@mockmatch/ui/blur-fade"
import { appPath, DOCS_URL } from "../constants"

export function LandingHero() {
  const { t } = useTranslation("landing")

  return (
    <section className="relative overflow-hidden">
      {/* Soft canvas wash — clean light marketing, not product chrome */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--primary) 12%, white) 0%, transparent 55%), linear-gradient(180deg, #ffffff 0%, var(--lp-canvas) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--lp-line-strong), transparent)",
        }}
      />

      <div className="lp-container relative flex flex-col items-center px-4 pb-16 pt-16 text-center sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-28">
        <BlurFade delay={0} direction="up" offset={10}>
          <p className="lp-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-white/80 px-3.5 py-1.5 shadow-[var(--lp-shadow-sm)] backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            {t("hero.eyebrow")}
          </p>
        </BlurFade>

        <BlurFade delay={0.05} direction="up" offset={14}>
          <h1 className="lp-display mx-auto max-w-4xl">{t("hero.title")}</h1>
        </BlurFade>

        <BlurFade delay={0.1} direction="up" offset={14}>
          <p className="lp-lede mx-auto mt-6 max-w-2xl">{t("hero.description")}</p>
        </BlurFade>

        <BlurFade delay={0.15} direction="up" offset={14}>
          <div className="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-11 rounded-full bg-[var(--lp-ink)] px-6 text-[0.9375rem] font-medium text-white shadow-[var(--lp-shadow-md)] hover:bg-[var(--lp-ink)]/90"
              nativeButton={false}
              render={<a href={appPath("/signup")} />}
            >
              {t("hero.primaryCta")}
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-full border-[var(--lp-line-strong)] bg-white px-6 text-[0.9375rem] font-medium text-[var(--lp-ink)] shadow-[var(--lp-shadow-sm)] hover:bg-black/[0.02]"
              nativeButton={false}
              render={
                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" />
              }
            >
              {t("hero.secondaryCta")}
            </Button>
          </div>
        </BlurFade>
      </div>
    </section>
  )
}

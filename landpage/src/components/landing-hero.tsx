import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { BlurFade } from "@mockmatch/ui/blur-fade"
import { appPath, DOCS_URL } from "../constants"
import { DemoResume } from "./demos/demo-resume"

export function LandingHero() {
  const { t } = useTranslation("landing")

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% -5%, color-mix(in oklch, var(--primary) 11%, white) 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, var(--lp-canvas) 72%, #ffffff 100%)",
        }}
      />

      <div className="lp-container relative flex flex-col items-center px-4 pb-10 pt-14 text-center sm:pb-14 sm:pt-20 lg:pt-24">
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
          <p className="lp-lede mx-auto mt-5 max-w-2xl">{t("hero.description")}</p>
        </BlurFade>

        <BlurFade delay={0.15} direction="up" offset={14}>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
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

        {/* Attio-style product stage under CTAs */}
        <BlurFade delay={0.22} direction="up" offset={20} className="mt-12 w-full max-w-5xl sm:mt-14">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-x-8 -bottom-10 -top-4 hidden rounded-[2rem] sm:block"
              style={{
                background:
                  "radial-gradient(60% 80% at 50% 100%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
              }}
            />
            <DemoResume className="relative" />
          </div>
        </BlurFade>
      </div>
    </section>
  )
}

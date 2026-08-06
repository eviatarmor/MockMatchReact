import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { appPath } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

export function LandingCta() {
  const { t } = useTranslation("landing")

  return (
    <section className="lp-section bg-white">
      <div className="lp-container">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-[calc(var(--lp-radius)+0.25rem)] bg-[var(--lp-ink)] px-6 py-14 text-white shadow-[var(--lp-shadow-lg)] sm:px-14 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(80% 80% at 100% 0%, color-mix(in oklch, var(--primary) 55%, transparent), transparent 55%)",
              }}
            />
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
              <h2 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-balance">
                {t("cta.title")}
              </h2>
              <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-white/70 text-pretty">
                {t("cta.description")}
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 rounded-full bg-white px-6 text-[0.9375rem] font-medium text-[var(--lp-ink)] hover:bg-white/90"
                  nativeButton={false}
                  render={<a href={appPath("/signup")} />}
                >
                  {t("cta.primaryCta")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-transparent px-6 text-[0.9375rem] font-medium text-white hover:bg-white/10 hover:text-white"
                  nativeButton={false}
                  render={<a href={appPath("/login")} />}
                >
                  {t("cta.secondaryCta")}
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

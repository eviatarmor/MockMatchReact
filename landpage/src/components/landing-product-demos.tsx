import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { appPath } from "../constants"
import { ScrollReveal } from "./scroll-reveal"
import { SectionHeading } from "./section-heading"
import { DemoResume } from "./demos/demo-resume"
import { DemoApply } from "./demos/demo-apply"
import { DemoInterview } from "./demos/demo-interview"

export function LandingProductDemos() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="product-demos"
      className="lp-section scroll-mt-20 bg-white"
      aria-labelledby="product-demos-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <SectionHeading
            eyebrow={t("demos.eyebrow")}
            title={t("demos.title")}
            description={t("demos.description")}
            titleId="product-demos-heading"
          />
        </ScrollReveal>

        {/* Resume — media left on large screens */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <ScrollReveal>
            <DemoResume />
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div>
              <p className="lp-eyebrow mb-3">{t("demos.resume.eyebrow")}</p>
              <h3 className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold tracking-[-0.025em] text-[var(--lp-ink)] text-balance">
                {t("demos.resume.title")}
              </h3>
              <p className="lp-lede mt-3 max-w-md">{t("demos.resume.body")}</p>
              <ul className="mt-5 space-y-2.5 text-sm text-[var(--lp-muted)]">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.resume.bullets.0")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.resume.bullets.1")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.resume.bullets.2")}
                </li>
              </ul>
              <Button
                className="mt-6 h-10 rounded-full bg-[var(--lp-ink)] px-5 text-[0.8125rem] font-medium text-white hover:bg-[var(--lp-ink)]/90"
                nativeButton={false}
                render={<a href={appPath("/signup")} />}
              >
                {t("demos.resume.cta")}
                <ArrowRight data-icon="inline-end" className="size-3.5" />
              </Button>
            </div>
          </ScrollReveal>
        </div>

        {/* Apply — media right */}
        <div className="mt-20 grid items-center gap-10 lg:mt-28 lg:grid-cols-2 lg:gap-14">
          <ScrollReveal className="order-2 lg:order-1">
            <div>
              <p className="lp-eyebrow mb-3">{t("demos.apply.eyebrow")}</p>
              <h3 className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold tracking-[-0.025em] text-[var(--lp-ink)] text-balance">
                {t("demos.apply.title")}
              </h3>
              <p className="lp-lede mt-3 max-w-md">{t("demos.apply.body")}</p>
              <ul className="mt-5 space-y-2.5 text-sm text-[var(--lp-muted)]">
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.apply.bullets.0")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.apply.bullets.1")}
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {t("demos.apply.bullets.2")}
                </li>
              </ul>
              <Button
                className="mt-6 h-10 rounded-full bg-[var(--lp-ink)] px-5 text-[0.8125rem] font-medium text-white hover:bg-[var(--lp-ink)]/90"
                nativeButton={false}
                render={<a href={appPath("/signup")} />}
              >
                {t("demos.apply.cta")}
                <ArrowRight data-icon="inline-end" className="size-3.5" />
              </Button>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08} className="order-1 lg:order-2">
            <DemoApply />
          </ScrollReveal>
        </div>

        {/* Interview — full width media */}
        <div className="mt-20 lg:mt-28">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="lp-eyebrow mb-3">{t("demos.interview.eyebrow")}</p>
              <h3 className="text-[clamp(1.375rem,2.4vw,1.75rem)] font-semibold tracking-[-0.025em] text-[var(--lp-ink)] text-balance">
                {t("demos.interview.title")}
              </h3>
              <p className="lp-lede mx-auto mt-3 max-w-lg">
                {t("demos.interview.body")}
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div className="mx-auto max-w-4xl">
              <DemoInterview />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

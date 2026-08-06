import { useTranslation } from "react-i18next"
import { LANDING_CHANGELOG_ITEMS } from "../constants"
import { ScrollReveal } from "./scroll-reveal"
import { SectionHeading } from "./section-heading"

export function LandingChangelog() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="changelog"
      className="lp-section scroll-mt-20 bg-white"
      aria-labelledby="changelog-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <SectionHeading
            eyebrow={t("changelog.eyebrow")}
            title={t("changelog.title")}
            description={t("changelog.description")}
            titleId="changelog-heading"
          />
        </ScrollReveal>

        <ul className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {LANDING_CHANGELOG_ITEMS.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 0.05}>
              <li className="lp-card flex h-full flex-col p-6 transition-shadow duration-300 hover:shadow-[var(--lp-shadow-md)]">
                <h3 className="text-[0.9375rem] font-semibold tracking-tight text-[var(--lp-ink)]">
                  {t(item.labelKey)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--lp-muted)] text-pretty">
                  {t(item.bodyKey)}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

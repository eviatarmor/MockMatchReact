import { useTranslation } from "react-i18next"
import { LANDING_CHANGELOG_ITEMS } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

export function LandingChangelog() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="changelog"
      className="scroll-mt-16 border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="changelog-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              {t("changelog.eyebrow")}
            </p>
            <h2
              id="changelog-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("changelog.title")}
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              {t("changelog.description")}
            </p>
          </div>
        </ScrollReveal>

        <ul className="grid gap-4 sm:grid-cols-3">
          {LANDING_CHANGELOG_ITEMS.map((item, i) => (
            <ScrollReveal key={item.id} delay={i * 0.05}>
              <li className="h-full rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  {t(item.labelKey)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">
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

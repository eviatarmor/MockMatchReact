import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { ScrollReveal } from "./scroll-reveal"

export function LandingCta() {
  const { t } = useTranslation("landing")

  return (
    <section className="border-b border-border/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-14">
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-start gap-4 sm:items-center sm:text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("cta.title")}
              </h2>
              <p className="text-primary-foreground/80 text-pretty">
                {t("cta.description")}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-10 bg-white px-4 text-primary hover:bg-white/90"
                  render={<Link to="/signup" />}
                >
                  {t("cta.primaryCta")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 border-white/30 bg-transparent px-4 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  render={<Link to="/login" />}
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

import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { InteractiveGridPattern } from "@mockmatch/ui/interactive-grid-pattern"
import { BlurFade } from "@mockmatch/ui/blur-fade"
import { DOCS_URL } from "../constants"

export function LandingHero() {
  const { t } = useTranslation("landing")

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-primary/[0.04] dark:bg-primary/[0.08]" />
      <InteractiveGridPattern
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
        width={40}
        height={40}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <BlurFade delay={0} direction="up" offset={10}>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            {t("hero.eyebrow")}
          </p>
        </BlurFade>
        <BlurFade delay={0.05} direction="up" offset={12}>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {t("hero.title")}
          </h1>
        </BlurFade>
        <BlurFade delay={0.1} direction="up" offset={12}>
          <p className="max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            {t("hero.description")}
          </p>
        </BlurFade>
        <BlurFade delay={0.15} direction="up" offset={12}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-10 px-4"
              nativeButton={false}
              render={<Link to="/signup" />}
            >
              {t("hero.primaryCta")}
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-10 px-4"
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

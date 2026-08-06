import { useTranslation } from "react-i18next"
import {
  ClipboardList,
  FileText,
  Gauge,
  MonitorPlay,
} from "lucide-react"
import { BentoCard, BentoGrid } from "@mockmatch/ui/bento-grid"
import { LANDING_BENTO_FEATURES } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

const ICONS = {
  resume: FileText,
  practice: MonitorPlay,
  jobs: ClipboardList,
  readiness: Gauge,
} as const

function BentoBackground({ id }: { id: string }) {
  if (id === "resume") {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
    )
  }
  if (id === "practice") {
    return (
      <div className="absolute -right-6 -top-6 size-40 rounded-full bg-primary/10 blur-2xl" />
    )
  }
  if (id === "jobs") {
    return (
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 to-transparent" />
    )
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 via-transparent to-transparent" />
  )
}

export function LandingBento() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="features"
      className="scroll-mt-16 border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              {t("features.eyebrow")}
            </p>
            <h2
              id="features-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("features.title")}
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              {t("features.description")}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <BentoGrid>
            {LANDING_BENTO_FEATURES.map((feature) => (
              <BentoCard
                key={feature.id}
                name={t(feature.nameKey)}
                description={t(feature.descriptionKey)}
                Icon={ICONS[feature.id as keyof typeof ICONS]}
                className={feature.className}
                background={<BentoBackground id={feature.id} />}
                href="/signup"
                cta={t("nav.signup")}
              />
            ))}
          </BentoGrid>
        </ScrollReveal>
      </div>
    </section>
  )
}

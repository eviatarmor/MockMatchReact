import { useTranslation } from "react-i18next"
import {
  ClipboardList,
  FileText,
  Gauge,
  MonitorPlay,
} from "lucide-react"
import { BentoCard, BentoGrid } from "@mockmatch/ui/bento-grid"
import { appPath, LANDING_BENTO_FEATURES } from "../constants"
import { ScrollReveal } from "./scroll-reveal"
import { SectionHeading } from "./section-heading"

const ICONS = {
  resume: FileText,
  practice: MonitorPlay,
  jobs: ClipboardList,
  readiness: Gauge,
} as const

function BentoBackground({ id }: { id: string }) {
  if (id === "resume") {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%)]" />
    )
  }
  if (id === "practice") {
    return (
      <div className="absolute -right-8 -top-8 size-44 rounded-full bg-primary/[0.07] blur-3xl" />
    )
  }
  if (id === "jobs") {
    return (
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/[0.02] to-transparent" />
    )
  }
  return (
    <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_0%_100%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_65%)]" />
  )
}

export function LandingBento() {
  const { t } = useTranslation("landing")

  return (
    <section
      id="features"
      className="lp-section scroll-mt-20 bg-[var(--lp-canvas)]"
      aria-labelledby="features-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <SectionHeading
            eyebrow={t("features.eyebrow")}
            title={t("features.title")}
            description={t("features.description")}
            titleId="features-heading"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <BentoGrid className="auto-rows-[17rem] gap-4 sm:auto-rows-[19rem] lg:auto-rows-[21rem] lg:gap-5">
            {LANDING_BENTO_FEATURES.map((feature) => (
              <BentoCard
                key={feature.id}
                name={t(feature.nameKey)}
                description={t(feature.descriptionKey)}
                Icon={ICONS[feature.id as keyof typeof ICONS]}
                className={`${feature.className} !rounded-[var(--lp-radius)] !bg-white !shadow-[var(--lp-shadow-sm)] ring-1 ring-black/[0.06] transition-shadow duration-300 hover:!shadow-[var(--lp-shadow-md)] dark:!bg-white dark:![border:none] dark:![box-shadow:var(--lp-shadow-sm)]`}
                background={<BentoBackground id={feature.id} />}
                href={appPath("/signup")}
                cta={t("nav.signup")}
              />
            ))}
          </BentoGrid>
        </ScrollReveal>
      </div>
    </section>
  )
}

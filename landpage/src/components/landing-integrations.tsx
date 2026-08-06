import { createRef, useMemo, useRef, type ReactNode, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar,
  Mail,
  MessageSquare,
  Video,
  type LucideIcon,
} from "lucide-react"
import { AnimatedBeam } from "@mockmatch/ui/animated-beam"
import { AppLogo } from "./app-logo"
import { cn } from "@mockmatch/ui/utils"
import { LANDING_INTEGRATION_NODES } from "../constants"
import { ScrollReveal } from "./scroll-reveal"
import { SectionHeading } from "./section-heading"

const NODE_ICONS: Record<
  (typeof LANDING_INTEGRATION_NODES)[number]["id"],
  LucideIcon
> = {
  zoom: Video,
  meet: Video,
  outlook: Mail,
  gmail: Mail,
  chat: MessageSquare,
  calendar: Calendar,
}

/** Beam layout: left column → center, right column → center (reverse). */
const LEFT_NODE_IDS = ["zoom", "outlook", "chat"] as const
const RIGHT_NODE_IDS = ["meet", "gmail", "calendar"] as const

/** Vertical fan for side nodes (top / mid / bottom) — table avoids branchy map callbacks. */
const BEAM_SPECS = [
  { id: "zoom" as const, reverse: false, curvature: -40, endYOffset: -6 },
  { id: "outlook" as const, reverse: false, curvature: 0, endYOffset: 0 },
  { id: "chat" as const, reverse: false, curvature: 40, endYOffset: 6 },
  { id: "meet" as const, reverse: true, curvature: -40, endYOffset: -6 },
  { id: "gmail" as const, reverse: true, curvature: 0, endYOffset: 0 },
  { id: "calendar" as const, reverse: true, curvature: 40, endYOffset: 6 },
] as const

function IntegrationCircle({
  className,
  children,
  label,
  circleRef,
}: {
  className?: string
  children?: ReactNode
  label: string
  circleRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={circleRef}
      className={cn(
        "z-10 flex size-12 flex-col items-center justify-center rounded-full border border-[var(--lp-line-strong)] bg-white p-2 shadow-[var(--lp-shadow-sm)] sm:size-14",
        className
      )}
      title={label}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LandingIntegrations() {
  const { t } = useTranslation("landing")
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)

  const nodeRefs = useMemo(() => {
    const map = {} as Record<
      (typeof LANDING_INTEGRATION_NODES)[number]["id"],
      RefObject<HTMLDivElement | null>
    >
    for (const node of LANDING_INTEGRATION_NODES) {
      map[node.id] = createRef<HTMLDivElement>()
    }
    return map
  }, [])

  const primary = "oklch(0.52 0.21 262)"
  const primarySoft = "oklch(0.62 0.21 262)"

  const labelFor = (id: (typeof LANDING_INTEGRATION_NODES)[number]["id"]) => {
    const node = LANDING_INTEGRATION_NODES.find((n) => n.id === id)
    return node ? t(node.labelKey) : id
  }

  const renderNode = (
    id: (typeof LANDING_INTEGRATION_NODES)[number]["id"]
  ) => {
    const Icon = NODE_ICONS[id]
    return (
      <IntegrationCircle
        key={id}
        circleRef={nodeRefs[id]}
        label={labelFor(id)}
      >
        <Icon className="size-5 text-[var(--lp-ink)]/70 sm:size-6" aria-hidden />
      </IntegrationCircle>
    )
  }

  return (
    <section
      id="integrations"
      className="lp-section scroll-mt-20 bg-white"
      aria-labelledby="integrations-heading"
    >
      <div className="lp-container">
        <ScrollReveal>
          <SectionHeading
            eyebrow={t("integrations.eyebrow")}
            title={t("integrations.title")}
            description={t("integrations.description")}
            titleId="integrations-heading"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div
            ref={containerRef}
            className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-[var(--lp-radius)] border border-[var(--lp-line)] bg-[var(--lp-canvas)] p-6 shadow-[var(--lp-shadow-sm)] sm:h-[400px] sm:p-10"
          >
            <div className="flex size-full max-w-lg flex-row items-center justify-between gap-6 sm:gap-10">
              <div className="flex flex-col justify-center gap-6 sm:gap-8">
                {LEFT_NODE_IDS.map((id) => renderNode(id))}
              </div>

              <IntegrationCircle
                circleRef={centerRef}
                label={t("integrations.centerLabel")}
                className="size-16 border-primary/25 bg-white sm:size-20"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary p-1.5 sm:size-10">
                  <AppLogo className="size-full" />
                </span>
              </IntegrationCircle>

              <div className="flex flex-col justify-center gap-6 sm:gap-8">
                {RIGHT_NODE_IDS.map((id) => renderNode(id))}
              </div>
            </div>

            {BEAM_SPECS.map((beam) => (
              <AnimatedBeam
                key={beam.id}
                containerRef={containerRef}
                fromRef={nodeRefs[beam.id]}
                toRef={centerRef}
                reverse={beam.reverse}
                curvature={beam.curvature}
                endYOffset={beam.endYOffset}
                gradientStartColor={primary}
                gradientStopColor={primarySoft}
                pathColor="rgba(12,12,12,0.12)"
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

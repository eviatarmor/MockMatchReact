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
import { AppLogo } from "@/components/icons/app-logo"
import { cn } from "@/lib/utils"
import { LANDING_INTEGRATION_NODES } from "../constants"
import { ScrollReveal } from "./scroll-reveal"

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
        "z-10 flex size-12 flex-col items-center justify-center rounded-full border-2 border-border bg-card p-2 shadow-sm sm:size-14",
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
        <Icon className="size-5 text-foreground/80 sm:size-6" aria-hidden />
      </IntegrationCircle>
    )
  }

  return (
    <section
      id="integrations"
      className="scroll-mt-16 border-b border-border/60 py-16 sm:py-20"
      aria-labelledby="integrations-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-primary uppercase">
              {t("integrations.eyebrow")}
            </p>
            <h2
              id="integrations-heading"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("integrations.title")}
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              {t("integrations.description")}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div
            ref={containerRef}
            className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-card p-6 sm:h-[380px] sm:p-10"
          >
            <div className="flex size-full max-w-lg flex-row items-center justify-between gap-6 sm:gap-10">
              <div className="flex flex-col justify-center gap-6 sm:gap-8">
                {LEFT_NODE_IDS.map((id) => renderNode(id))}
              </div>

              <IntegrationCircle
                circleRef={centerRef}
                label={t("integrations.centerLabel")}
                className="size-16 border-primary/40 bg-primary/5 sm:size-20"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-primary p-1 sm:size-10">
                  <AppLogo className="size-full" />
                </span>
              </IntegrationCircle>

              <div className="flex flex-col justify-center gap-6 sm:gap-8">
                {RIGHT_NODE_IDS.map((id) => renderNode(id))}
              </div>
            </div>

            {LEFT_NODE_IDS.map((id, i) => (
              <AnimatedBeam
                key={`left-${id}`}
                containerRef={containerRef}
                fromRef={nodeRefs[id]}
                toRef={centerRef}
                curvature={i === 0 ? -40 : i === 2 ? 40 : 0}
                endYOffset={i === 0 ? -6 : i === 2 ? 6 : 0}
                gradientStartColor={primary}
                gradientStopColor={primarySoft}
                pathColor="var(--border)"
              />
            ))}
            {RIGHT_NODE_IDS.map((id, i) => (
              <AnimatedBeam
                key={`right-${id}`}
                containerRef={containerRef}
                fromRef={nodeRefs[id]}
                toRef={centerRef}
                reverse
                curvature={i === 0 ? -40 : i === 2 ? 40 : 0}
                endYOffset={i === 0 ? -6 : i === 2 ? 6 : 0}
                gradientStartColor={primary}
                gradientStopColor={primarySoft}
                pathColor="var(--border)"
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

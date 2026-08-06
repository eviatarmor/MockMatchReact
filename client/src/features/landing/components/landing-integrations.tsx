import { forwardRef, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar,
  Mail,
  MessageSquare,
  Video,
} from "lucide-react"
import { AnimatedBeam } from "@mockmatch/ui/animated-beam"
import { AppLogo } from "@/components/icons/app-logo"
import { cn } from "@/lib/utils"
import { ScrollReveal } from "./scroll-reveal"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label: string }
>(function Circle({ className, children, label }, ref) {
  return (
    <div
      ref={ref}
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
})

export function LandingIntegrations() {
  const { t } = useTranslation("landing")
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const meetRef = useRef<HTMLDivElement>(null)
  const outlookRef = useRef<HTMLDivElement>(null)
  const gmailRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const primary = "oklch(0.52 0.21 262)"
  const primarySoft = "oklch(0.62 0.21 262)"

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
            <div className="flex size-full max-w-lg flex-col items-stretch justify-between gap-8">
              <div className="flex flex-row items-center justify-between">
                <Circle ref={zoomRef} label={t("integrations.nodes.zoom")}>
                  <Video className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
                <Circle ref={meetRef} label={t("integrations.nodes.meet")}>
                  <Video className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
              </div>
              <div className="flex flex-row items-center justify-between">
                <Circle ref={outlookRef} label={t("integrations.nodes.outlook")}>
                  <Mail className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
                <Circle
                  ref={centerRef}
                  label={t("integrations.centerLabel")}
                  className="size-16 border-primary/40 bg-primary/5 sm:size-20"
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-primary p-1 sm:size-10">
                    <AppLogo className="size-full" />
                  </span>
                </Circle>
                <Circle ref={gmailRef} label={t("integrations.nodes.gmail")}>
                  <Mail className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
              </div>
              <div className="flex flex-row items-center justify-between">
                <Circle ref={chatRef} label={t("integrations.nodes.chat")}>
                  <MessageSquare className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
                <Circle ref={calendarRef} label={t("integrations.nodes.calendar")}>
                  <Calendar className="size-5 text-foreground/80 sm:size-6" aria-hidden />
                </Circle>
              </div>
            </div>

            <AnimatedBeam
              containerRef={containerRef}
              fromRef={zoomRef}
              toRef={centerRef}
              curvature={-50}
              endYOffset={-6}
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={meetRef}
              toRef={centerRef}
              curvature={-50}
              endYOffset={-6}
              reverse
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={outlookRef}
              toRef={centerRef}
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={gmailRef}
              toRef={centerRef}
              reverse
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={chatRef}
              toRef={centerRef}
              curvature={50}
              endYOffset={6}
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
            <AnimatedBeam
              containerRef={containerRef}
              fromRef={calendarRef}
              toRef={centerRef}
              curvature={50}
              endYOffset={6}
              reverse
              gradientStartColor={primary}
              gradientStopColor={primarySoft}
              pathColor="var(--border)"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

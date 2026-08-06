import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { DemoMedia } from "./demo-media"

const STEPS = [
  {
    id: "template",
    rail: "Templates",
    label: "Pick a template",
    body: "Clean single-column · ATS-friendly",
  },
  {
    id: "summary",
    rail: "Sections",
    label: "Write summary",
    body: "Product engineer shipping interview-ready materials.",
  },
  {
    id: "score",
    rail: "Score",
    label: "General health",
    body: "82 · Add two role keywords to climb past 90.",
  },
  {
    id: "export",
    rail: "Export",
    label: "Ready to share",
    body: "PDF export · collab share while you stay in the doc.",
  },
] as const

function ResumeMock({ animate }: { animate: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length)
    }, 2200)
    return () => window.clearInterval(id)
  }, [animate])

  const current = STEPS[step]!

  return (
    <div className="flex h-full min-h-[280px] bg-[var(--lp-canvas)] sm:min-h-0">
      {/* Side rail */}
      <div className="hidden w-[7.5rem] shrink-0 flex-col gap-1 border-r border-[var(--lp-line)] bg-[#111] p-2.5 sm:flex">
        <div className="mb-2 px-1.5 text-[0.625rem] font-semibold tracking-wide text-white/40 uppercase">
          Resume Lab
        </div>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={
              i === step
                ? "rounded-md bg-white/12 px-2 py-1.5 text-[0.6875rem] font-medium text-white"
                : "rounded-md px-2 py-1.5 text-[0.6875rem] text-white/45"
            }
          >
            {s.rail}
          </div>
        ))}
      </div>

      {/* Document canvas */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[0.75rem] font-semibold text-[var(--lp-ink)]">
            jordan-avery-resume
          </div>
          <div className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-semibold text-primary">
            Score 82
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-3">
          <div className="min-w-0 flex-1 rounded-lg border border-[var(--lp-line)] bg-white p-3 shadow-[var(--lp-shadow-sm)] sm:p-4">
            <div className="mb-3 h-2.5 w-1/3 rounded bg-[var(--lp-ink)]/90" />
            <div className="mb-4 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-black/[0.06]" />
              <div className="h-1.5 w-[92%] rounded bg-black/[0.06]" />
              <div className="h-1.5 w-[78%] rounded bg-black/[0.06]" />
            </div>
            <div className="mb-2 text-[0.625rem] font-semibold tracking-wide text-[var(--lp-faint)] uppercase">
              Experience
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-[70%] rounded bg-black/[0.08]" />
              <div className="h-1.5 w-full rounded bg-black/[0.05]" />
              <div className="h-1.5 w-[88%] rounded bg-black/[0.05]" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={animate ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={animate ? { opacity: 0, y: -4 } : undefined}
                transition={{ duration: 0.35 }}
                className="mt-4 rounded-md border border-primary/20 bg-primary/[0.06] px-2.5 py-2"
              >
                <div className="text-[0.6875rem] font-semibold text-primary">
                  {current.label}
                </div>
                <div className="mt-0.5 text-[0.6875rem] leading-snug text-[var(--lp-muted)]">
                  {current.body}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden w-[8.5rem] shrink-0 flex-col gap-2 rounded-lg border border-[var(--lp-line)] bg-white p-2.5 sm:flex">
            <div className="text-[0.625rem] font-semibold text-[var(--lp-faint)]">
              AI rail
            </div>
            {["Tighten summary", "Add keywords", "Fix bullets"].map((tip, i) => (
              <motion.div
                key={tip}
                animate={
                  animate
                    ? {
                        opacity: i === step % 3 ? 1 : 0.45,
                        scale: i === step % 3 ? 1 : 0.98,
                      }
                    : undefined
                }
                className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-canvas)] px-2 py-1.5 text-[0.625rem] text-[var(--lp-muted)]"
              >
                {tip}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DemoResume({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()

  return (
    <DemoMedia
      title="app.mockmatch.ai/resume-lab"
      videoBase="resume"
      className={className}
      toolbar={
        <div className="flex gap-1.5 text-[0.625rem] font-medium text-[var(--lp-faint)]">
          <span className="rounded bg-black/[0.04] px-2 py-0.5">Editor</span>
          <span className="rounded px-2 py-0.5">History</span>
          <span className="rounded px-2 py-0.5">Export</span>
        </div>
      }
    >
      <ResumeMock animate={!reduced} />
    </DemoMedia>
  )
}

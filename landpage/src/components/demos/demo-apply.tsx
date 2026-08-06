import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { DemoMedia } from "./demo-media"

const STAGE_LABELS = ["Saved", "Fit score", "Applied", "Interview"] as const

const JOBS = [
  { company: "Northwind Labs", role: "Senior Frontend", fit: 91 },
  { company: "Harbor AI", role: "Full-stack Eng", fit: 84 },
  { company: "Cedar Systems", role: "Product Eng", fit: 78 },
] as const

const STEP_COPY = [
  "Track a role from Discover",
  "Generate fit resume for Harbor AI",
  "Mark applied — questions added to bank",
  "Open simulation track for this stage",
] as const

// fallow-ignore-next-line complexity
function ApplyMock({ animate }: { animate: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % STAGE_LABELS.length)
    }, 2400)
    return () => window.clearInterval(id)
  }, [animate])

  const highlight = step % JOBS.length
  const stageLabel = STAGE_LABELS[step] ?? STAGE_LABELS[0]
  const stepCopy = STEP_COPY[step] ?? STEP_COPY[0]

  return (
    <div className="flex h-full min-h-[280px] flex-col bg-[var(--lp-canvas)] p-3 sm:min-h-0 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[0.8125rem] font-semibold text-[var(--lp-ink)]">
          Applications
        </div>
        <div className="flex gap-1">
          {STAGE_LABELS.map((label, i) => (
            <span
              key={label}
              className={
                i === step
                  ? "rounded-full bg-[var(--lp-ink)] px-2.5 py-1 text-[0.625rem] font-medium text-white"
                  : "rounded-full bg-white px-2.5 py-1 text-[0.625rem] font-medium text-[var(--lp-faint)] ring-1 ring-[var(--lp-line)]"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 sm:grid-cols-3">
        {JOBS.map((job, i) => (
          <motion.div
            key={job.company}
            animate={
              animate
                ? {
                    y: i === highlight ? -2 : 0,
                    boxShadow:
                      i === highlight
                        ? "0 8px 24px rgba(12,12,12,0.08)"
                        : "0 1px 2px rgba(12,12,12,0.04)",
                  }
                : undefined
            }
            className="flex flex-col rounded-xl border border-[var(--lp-line)] bg-white p-3"
          >
            <div className="text-[0.6875rem] font-semibold text-[var(--lp-ink)]">
              {job.company}
            </div>
            <div className="mt-0.5 text-[0.625rem] text-[var(--lp-muted)]">
              {job.role}
            </div>
            <div className="mt-auto pt-3">
              <div className="mb-1 flex items-center justify-between text-[0.625rem]">
                <span className="text-[var(--lp-faint)]">Fit</span>
                <span className="font-semibold text-primary">{job.fit}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${job.fit}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={animate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={animate ? { opacity: 0 } : undefined}
          className="mt-3 flex items-center justify-between rounded-lg border border-[var(--lp-line)] bg-white px-3 py-2.5"
        >
          <div>
            <div className="text-[0.6875rem] font-semibold text-[var(--lp-ink)]">
              {stepCopy}
            </div>
            <div className="text-[0.625rem] text-[var(--lp-muted)]">
              Kanban + table · no spreadsheet juggling
            </div>
          </div>
          <div className="rounded-full bg-primary px-2.5 py-1 text-[0.625rem] font-semibold text-white">
            {stageLabel}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function DemoApply({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()

  return (
    <DemoMedia
      title="app.mockmatch.ai/applications"
      videoBase="apply"
      className={className}
      toolbar={
        <div className="flex gap-1.5 text-[0.625rem] font-medium text-[var(--lp-faint)]">
          <span className="rounded bg-black/[0.04] px-2 py-0.5">Kanban</span>
          <span className="rounded px-2 py-0.5">Table</span>
          <span className="rounded px-2 py-0.5">Import job</span>
        </div>
      }
    >
      <ApplyMock animate={!reduced} />
    </DemoMedia>
  )
}

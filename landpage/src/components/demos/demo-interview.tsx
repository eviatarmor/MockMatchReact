import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { DemoMedia } from "./demo-media"

const TURNS = [
  {
    who: "agent" as const,
    text: "Walk me through a system design for a job-tracking board.",
  },
  {
    who: "you" as const,
    text: "I'd start with stages as columns, optimistic updates, and a readiness signal…",
  },
  {
    who: "agent" as const,
    text: "Good. What fails first under concurrent editors?",
  },
  {
    who: "you" as const,
    text: "Conflict on stage moves — use CRDT or last-write with presence.",
  },
]

function InterviewMock({ animate }: { animate: boolean }) {
  const [n, setN] = useState(1)

  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(() => {
      setN((v) => (v >= TURNS.length ? 1 : v + 1))
    }, 2000)
    return () => window.clearInterval(id)
  }, [animate])

  const visible = TURNS.slice(0, animate ? n : TURNS.length)

  return (
    <div className="flex h-full min-h-[280px] flex-col bg-[var(--lp-canvas)] sm:min-h-0">
      <div className="flex items-center gap-3 border-b border-[var(--lp-line)] bg-white px-3 py-2.5">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-[0.6875rem] font-bold text-primary">
          AI
        </div>
        <div>
          <div className="text-[0.75rem] font-semibold text-[var(--lp-ink)]">
            Conversation track
          </div>
          <div className="text-[0.625rem] text-[var(--lp-faint)]">
            Behavioral · live agent
          </div>
        </div>
        <div className="ms-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.625rem] font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
        <AnimatePresence initial={false}>
          {visible.map((turn, i) => (
            <motion.div
              key={`${turn.who}-${i}`}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              className={
                turn.who === "you"
                  ? "ms-8 rounded-2xl rounded-br-md bg-[var(--lp-ink)] px-3 py-2 text-[0.6875rem] leading-snug text-white"
                  : "me-8 rounded-2xl rounded-bl-md border border-[var(--lp-line)] bg-white px-3 py-2 text-[0.6875rem] leading-snug text-[var(--lp-ink)]"
              }
            >
              {turn.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function DemoInterview({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()

  return (
    <DemoMedia
      title="app.mockmatch.ai/simulations"
      videoBase="interview"
      className={className}
    >
      <InterviewMock animate={!reduced} />
    </DemoMedia>
  )
}

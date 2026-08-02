import { useEffect, useId, useState, type ComponentProps } from "react"
import { cn } from "../lib/utils"

export type RobotAgentState =
  | "asleep"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"

const SIZE_CLASS = {
  sm: "size-16",
  md: "size-32",
  lg: "size-48",
  xl: "size-64",
} as const

export type RobotAgentSize = keyof typeof SIZE_CLASS

export interface RobotAgentProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Conversational presence state. Default `idle`. */
  readonly state?: RobotAgentState
  /** Visual size. Default `lg` (192px). */
  readonly size?: RobotAgentSize
  /** Accessible label describing the agent. */
  readonly label?: string
}

/** Pose settle duration — keep in sync with CSS transitions below. */
const POSE_MS = 420

/**
 * Brand mascot as a live-agent presence (not a content loader).
 * Pose uses CSS transitions; loops stay on so state changes blend instead of
 * freezing mid-keyframe. Prefer {@link RobotLoader} for content-area waits.
 */
function RobotAgent({
  state = "idle",
  size = "lg",
  label = "MockMatch agent",
  className,
  ...props
}: RobotAgentProps) {
  const rawId = useId()
  const uid = rawId.replace(/:/g, "")
  const robotBlue = `${uid}-robotBlue`
  const faceBg = `${uid}-faceBg`
  const shell = `${uid}-shell`
  const root = `${uid}-root`
  const bot = `${uid}-bot`
  const face = `${uid}-face`
  const eyes = `${uid}-eyes`
  const mouth = `${uid}-mouth`
  const beam = `${uid}-beam`
  const antenna = `${uid}-antenna`
  const ring = `${uid}-ring`
  const zzz = `${uid}-zzz`

  // Soft cross-fade marker when state changes (does not kill loops).
  const [pulseKey, setPulseKey] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null
    const apply = () => setReduceMotion(Boolean(mq?.matches))
    apply()
    mq?.addEventListener("change", apply)
    return () => mq?.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    setPulseKey((k) => k + 1)
  }, [state])

  const loopOn = !reduceMotion

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-label={label}
      data-slot="robot-agent"
      data-state={state}
      data-loop={loopOn ? "true" : "false"}
      data-pulse={pulseKey}
      className={cn("shrink-0", SIZE_CLASS[size], className)}
      {...props}
    >
      <defs>
        <linearGradient id={robotBlue} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B5FFB" />
          <stop offset="100%" stopColor="#3749F8" />
        </linearGradient>
        <linearGradient id={faceBg} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#11265D" />
          <stop offset="100%" stopColor="#0B1A45" />
        </linearGradient>
        <linearGradient id={shell} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F7FF" />
          <stop offset="100%" stopColor="#DDE3F2" />
        </linearGradient>
        <style>
          {`
            /* User-space origins only — never fill-box (drifts nested faces). */
            .${root} {
              transform-origin: 128px 128px;
              transition: opacity ${POSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
            }
            .${bot} {
              transform-origin: 128px 148px;
              transition: transform ${POSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
            }
            .${antenna} {
              transform-origin: 128px 48px;
              transition: transform ${POSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
            }
            .${face} {
              transform-origin: 128px 128px;
              transition: opacity ${POSE_MS}ms ease;
            }
            .${eyes} {
              transform-origin: 128px 125px;
              transition: transform ${POSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity ${POSE_MS}ms ease;
            }
            .${mouth} {
              transform-origin: 128px 158px;
              transition: transform ${POSE_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity ${POSE_MS}ms ease;
            }
            .${beam} {
              opacity: 0;
              transition: opacity 0.28s ease;
            }
            .${ring} {
              opacity: 0;
              transform-origin: 128px 128px;
              transition: opacity 0.35s ease, transform ${POSE_MS}ms ease;
            }
            .${zzz} {
              opacity: 0;
              transform-origin: 188px 72px;
              transition: opacity 0.4s ease;
              font-family: ui-rounded, "Segoe UI", system-ui, sans-serif;
              font-size: 18px;
              font-weight: 700;
              fill: #5B5FFB;
            }

            /* Blend when CSS animation replaces a transitioning transform */
            .${bot}, .${antenna}, .${eyes}, .${mouth}, .${ring} {
              animation-fill-mode: both;
            }

            @media (prefers-reduced-motion: reduce) {
              .${root}, .${bot}, .${antenna}, .${face}, .${eyes}, .${mouth}, .${beam}, .${ring}, .${zzz} {
                transition: none !important;
                animation: none !important;
              }
            }

            /* ── Poses (static baseline; loops ride on top) ── */
            [data-state="asleep"] .${root} { opacity: 0.82; }
            [data-state="asleep"] .${bot} { transform: translateY(8px); }
            [data-state="asleep"] .${antenna} { transform: rotate(-12deg); }
            [data-state="asleep"] .${eyes} { transform: scaleY(0.18); opacity: 0.8; }
            [data-state="asleep"] .${mouth} { transform: scaleY(0.7); opacity: 0.4; }
            [data-state="asleep"] .${zzz} { opacity: 0.85; }

            [data-state="idle"] .${root} { opacity: 1; }
            [data-state="idle"] .${bot} { transform: translateY(0); }
            [data-state="idle"] .${antenna} { transform: rotate(0deg); }
            [data-state="idle"] .${eyes} { transform: scaleY(1); opacity: 1; }
            [data-state="idle"] .${mouth} { transform: scaleY(1); opacity: 1; }

            [data-state="listening"] .${root} { opacity: 1; }
            [data-state="listening"] .${bot} { transform: translateY(-3px); }
            [data-state="listening"] .${antenna} { transform: rotate(6deg); }
            [data-state="listening"] .${eyes} { transform: scaleY(1); opacity: 1; }
            [data-state="listening"] .${mouth} { transform: scaleY(0.9); opacity: 1; }
            [data-state="listening"] .${ring} { opacity: 0.45; transform: scale(1); }

            [data-state="thinking"] .${root} { opacity: 1; }
            [data-state="thinking"] .${bot} { transform: translateY(-1px); }
            [data-state="thinking"] .${antenna} { transform: rotate(-8deg); }
            [data-state="thinking"] .${eyes} { transform: scaleY(1); opacity: 1; }
            [data-state="thinking"] .${mouth} { transform: scaleY(0.92); opacity: 0.9; }

            [data-state="speaking"] .${root} { opacity: 1; }
            [data-state="speaking"] .${bot} { transform: translateY(-2px); }
            [data-state="speaking"] .${antenna} { transform: rotate(0deg); }
            [data-state="speaking"] .${eyes} { transform: scaleY(1); opacity: 1; }
            [data-state="speaking"] .${mouth} { transform: scaleY(1); opacity: 1; }
            [data-state="speaking"] .${beam} { opacity: 0.75; }

            /* ── Loops stay on across pose changes (no mid-frame freeze) ── */
            [data-loop="true"][data-state="asleep"] .${bot} {
              animation: ${uid}-sleep-breathe 3.6s ease-in-out infinite;
            }
            [data-loop="true"][data-state="asleep"] .${antenna} {
              animation: ${uid}-sleep-ant 3.6s ease-in-out infinite;
            }
            [data-loop="true"][data-state="asleep"] .${eyes} {
              animation: ${uid}-sleep-eyes 3.6s ease-in-out infinite;
            }
            [data-loop="true"][data-state="asleep"] .${zzz} {
              animation: ${uid}-zzz 2.4s ease-in-out infinite;
            }

            [data-loop="true"][data-state="idle"] .${bot} {
              animation: ${uid}-breathe 3.2s ease-in-out infinite;
            }
            [data-loop="true"][data-state="idle"] .${eyes} {
              animation: ${uid}-blink 4.8s ease-in-out infinite;
            }

            [data-loop="true"][data-state="listening"] .${bot} {
              animation: ${uid}-listen-bob 2s ease-in-out infinite;
            }
            [data-loop="true"][data-state="listening"] .${antenna} {
              animation: ${uid}-ant-nudge 1.8s ease-in-out infinite;
            }
            [data-loop="true"][data-state="listening"] .${ring} {
              animation: ${uid}-ring 1.5s ease-out infinite;
            }

            [data-loop="true"][data-state="thinking"] .${antenna} {
              animation: ${uid}-think-ant 1.25s ease-in-out infinite;
            }
            [data-loop="true"][data-state="thinking"] .${eyes} {
              animation: ${uid}-think-look 1.6s ease-in-out infinite;
            }
            [data-loop="true"][data-state="thinking"] .${beam} {
              animation: ${uid}-beam-pulse 1.1s ease-out infinite;
            }

            /* Speaking mouth starts immediately — no pose-gate delay */
            [data-loop="true"][data-state="speaking"] .${mouth} {
              animation: ${uid}-talk 0.42s ease-in-out infinite;
            }
            [data-loop="true"][data-state="speaking"] .${bot} {
              animation: ${uid}-speak-bob 1.15s ease-in-out infinite;
            }
            [data-loop="true"][data-state="speaking"] .${beam} {
              animation: ${uid}-beam-pulse 0.85s ease-out infinite;
            }
            [data-loop="true"][data-state="speaking"] .${eyes} {
              animation: ${uid}-speak-eyes 2.8s ease-in-out infinite;
            }

            /* Keyframes start/end at pose rest so loops don't snap */
            @keyframes ${uid}-sleep-breathe {
              0%, 100% { transform: translateY(8px); }
              50% { transform: translateY(11px); }
            }
            @keyframes ${uid}-sleep-ant {
              0%, 100% { transform: rotate(-12deg); }
              50% { transform: rotate(-16deg); }
            }
            @keyframes ${uid}-sleep-eyes {
              0%, 100% { transform: scaleY(0.18); opacity: 0.8; }
              50% { transform: scaleY(0.12); opacity: 0.7; }
            }
            @keyframes ${uid}-zzz {
              0% { opacity: 0.15; transform: translate(0, 4px) scale(0.85); }
              40% { opacity: 0.9; transform: translate(4px, -6px) scale(1); }
              100% { opacity: 0; transform: translate(10px, -16px) scale(1.1); }
            }
            @keyframes ${uid}-breathe {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes ${uid}-blink {
              0%, 88%, 100% { transform: scaleY(1); }
              92% { transform: scaleY(0.12); }
            }
            @keyframes ${uid}-listen-bob {
              0%, 100% { transform: translateY(-3px); }
              50% { transform: translateY(-6px); }
            }
            @keyframes ${uid}-ant-nudge {
              0%, 100% { transform: rotate(4deg); }
              50% { transform: rotate(12deg); }
            }
            @keyframes ${uid}-ring {
              0% { opacity: 0.5; transform: scale(0.96); }
              100% { opacity: 0; transform: scale(1.08); }
            }
            @keyframes ${uid}-think-ant {
              0%, 100% { transform: rotate(-8deg); }
              50% { transform: rotate(10deg); }
            }
            @keyframes ${uid}-think-look {
              0%, 100% { transform: translateX(0) scaleY(1); }
              35% { transform: translateX(-5px) scaleY(1); }
              70% { transform: translateX(5px) scaleY(1); }
            }
            @keyframes ${uid}-beam-pulse {
              0% { opacity: 0.85; }
              100% { opacity: 0; }
            }
            @keyframes ${uid}-talk {
              0%, 100% { transform: scaleY(1.05); }
              25% { transform: scaleY(0.45); }
              50% { transform: scaleY(0.85); }
              75% { transform: scaleY(0.5); }
            }
            @keyframes ${uid}-speak-bob {
              0%, 100% { transform: translateY(-2px); }
              50% { transform: translateY(-5px); }
            }
            @keyframes ${uid}-speak-eyes {
              0%, 100% { transform: scaleY(1); }
              50% { transform: scaleY(0.96); }
            }
          `}
        </style>
      </defs>

      <g className={root}>
        <circle
          className={ring}
          cx="128"
          cy="128"
          r="118"
          fill="none"
          stroke="#5B5FFB"
          strokeWidth="3"
          strokeOpacity="0.35"
        />

        <g className={bot}>
          <g className={antenna}>
            <rect x="122" y="28" width="12" height="34" rx="6" fill={`url(#${robotBlue})`} />
            <circle cx="128" cy="18" r="12" fill={`url(#${robotBlue})`} />
            <circle
              className={beam}
              cx="128"
              cy="18"
              r="8"
              fill="none"
              stroke="#70E7FF"
              strokeWidth="2.5"
            />
            <circle
              className={beam}
              cx="128"
              cy="18"
              r="14"
              fill="none"
              stroke="#70E7FF"
              strokeWidth="2"
              style={{ animationDelay: "0.15s" }}
            />
          </g>

          <text className={zzz} x="176" y="78" aria-hidden="true">
            z
          </text>
          <text
            className={zzz}
            x="192"
            y="62"
            aria-hidden="true"
            style={{ animationDelay: "0.4s", fontSize: "14px" }}
          >
            z
          </text>

          <rect x="28" y="92" width="34" height="72" rx="18" fill={`url(#${robotBlue})`} />
          <rect x="194" y="92" width="34" height="72" rx="18" fill={`url(#${robotBlue})`} />
          <rect x="42" y="48" width="172" height="160" rx="52" fill={`url(#${shell})`} />
          <rect x="62" y="72" width="132" height="112" rx="36" fill={`url(#${faceBg})`} />

          {/* Face group: features stay in fixed coords relative to head */}
          <g className={face}>
            <g className={eyes}>
              <rect x="92" y="106" width="22" height="38" rx="11" fill="#70E7FF" />
              <rect x="142" y="106" width="22" height="38" rx="11" fill="#70E7FF" />
            </g>
            <path
              className={mouth}
              d="M102 154 Q128 176 154 154"
              fill="none"
              stroke="#70E7FF"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </g>

          <rect x="90" y="196" width="76" height="14" rx="7" fill={`url(#${robotBlue})`} />
        </g>
      </g>
    </svg>
  )
}

export { RobotAgent }

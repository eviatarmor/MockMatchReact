import { useId, type ComponentProps } from "react"
import { cn } from "../lib/utils"

const SIZE_CLASS = {
  sm: "size-12",
  md: "size-20",
  lg: "size-32",
} as const

export type RobotLoaderSize = keyof typeof SIZE_CLASS

export interface RobotLoaderProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Visual size. Default `md` (80px). */
  readonly size?: RobotLoaderSize
  /** Accessible label. Default "Loading". */
  readonly label?: string
}

/**
 * Brand mascot loader for content-area waits (full pane, panels, empty shells).
 * Prefer skeletons for list/grid layout shape; keep Spinner/Loader2 for buttons & chrome.
 */
function RobotLoader({
  size = "md",
  label = "Loading",
  className,
  ...props
}: RobotLoaderProps) {
  const rawId = useId()
  const uid = rawId.replace(/:/g, "")
  const robotBlue = `${uid}-robotBlue`
  const faceBg = `${uid}-faceBg`
  const shell = `${uid}-shell`
  const bot = `${uid}-bot`
  const eyes = `${uid}-eyes`
  const beam = `${uid}-beam`
  const antenna = `${uid}-antenna`
  const spin = `${uid}-spin`
  const look = `${uid}-look`
  const beamKf = `${uid}-beam`
  const lean = `${uid}-lean`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="status"
      aria-label={label}
      data-slot="robot-loader"
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
            .${bot} { animation: ${spin} 3.8s cubic-bezier(0.4, 0, 0.2, 1) infinite; transform-origin: 128px 128px; }
            .${eyes} { animation: ${look} 3.8s ease-in-out infinite; }
            .${beam} { animation: ${beamKf} 3.8s ease-out infinite; opacity: 0; }
            .${antenna} { animation: ${lean} 3.8s ease-in-out infinite; transform-origin: 128px 62px; }
            @keyframes ${spin} {
              0% { transform: rotate(0deg); }
              70% { transform: rotate(1080deg); }
              100% { transform: rotate(1080deg); }
            }
            @keyframes ${look} {
              0%, 68%, 100% { transform: translateX(0); }
              76% { transform: translateX(-8px); }
              84% { transform: translateX(8px); }
              92% { transform: translateX(-5px); }
            }
            @keyframes ${beamKf} {
              0%, 68%, 100% { opacity: 0; r: 0; }
              72% { opacity: 0.85; r: 6; }
              95% { opacity: 0; r: 26; }
            }
            @keyframes ${lean} {
              0% { transform: rotate(0deg); }
              15% { transform: rotate(-18deg); }
              30% { transform: rotate(15deg); }
              45% { transform: rotate(-22deg); }
              60% { transform: rotate(12deg); }
              70% { transform: rotate(-28deg); }
              78% { transform: rotate(5deg); }
              85% { transform: rotate(0deg); }
              100% { transform: rotate(0deg); }
            }
          `}
        </style>
      </defs>
      <g className={bot}>
        <g className={antenna}>
          <rect x="122" y="28" width="12" height="34" rx="6" fill={`url(#${robotBlue})`} />
          <circle cx="128" cy="18" r="12" fill={`url(#${robotBlue})`} />
          <circle
            className={beam}
            cx="128"
            cy="18"
            r="6"
            fill="none"
            stroke="#70E7FF"
            strokeWidth="2.5"
          />
          <circle
            className={beam}
            cx="128"
            cy="18"
            r="6"
            fill="none"
            stroke="#70E7FF"
            strokeWidth="2.5"
            style={{ animationDelay: "0.12s" }}
          />
          <circle
            className={beam}
            cx="128"
            cy="18"
            r="6"
            fill="none"
            stroke="#70E7FF"
            strokeWidth="2.5"
            style={{ animationDelay: "0.24s" }}
          />
        </g>
        <rect x="28" y="92" width="34" height="72" rx="18" fill={`url(#${robotBlue})`} />
        <rect x="194" y="92" width="34" height="72" rx="18" fill={`url(#${robotBlue})`} />
        <rect x="42" y="48" width="172" height="160" rx="52" fill={`url(#${shell})`} />
        <rect x="62" y="72" width="132" height="112" rx="36" fill={`url(#${faceBg})`} />
        <g className={eyes}>
          <rect x="92" y="106" width="22" height="38" rx="11" fill="#70E7FF" />
          <rect x="142" y="106" width="22" height="38" rx="11" fill="#70E7FF" />
        </g>
        <path
          d="M102 154 Q128 176 154 154"
          fill="none"
          stroke="#70E7FF"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <rect x="90" y="196" width="76" height="14" rx="7" fill={`url(#${robotBlue})`} />
      </g>
    </svg>
  )
}

export { RobotLoader }

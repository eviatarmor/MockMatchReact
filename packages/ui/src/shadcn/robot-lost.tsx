import { useId, type ComponentProps } from "react"
import { cn } from "../lib/utils"

const SIZE_CLASS = {
  sm: "size-24",
  md: "size-40",
  lg: "size-56",
} as const

export type RobotLostSize = keyof typeof SIZE_CLASS

export interface RobotLostProps extends Omit<ComponentProps<"svg">, "children"> {
  /** Visual size. Default `md` (160px). */
  readonly size?: RobotLostSize
  /** Accessible label. Default "Lost robot". */
  readonly label?: string
}

/**
 * Brand mascot for empty / not-found surfaces — soft wobble, searching eyes, frown.
 * Prefer {@link RobotLoader} for loading waits.
 */
function RobotLost({
  size = "md",
  label = "Lost robot",
  className,
  ...props
}: RobotLostProps) {
  const rawId = useId()
  const uid = rawId.replace(/:/g, "")
  const robotBlue = `${uid}-robotBlue`
  const faceBg = `${uid}-faceBg`
  const shell = `${uid}-shell`
  const bot = `${uid}-bot`
  const eyes = `${uid}-eyes`
  const antenna = `${uid}-antenna`
  const wobble = `${uid}-wobble`
  const look = `${uid}-look`
  const lean = `${uid}-lean`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      role="img"
      aria-label={label}
      data-slot="robot-lost"
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
            .${bot} { animation: ${wobble} 3s ease-in-out infinite; transform-origin: 128px 140px; }
            .${eyes} { animation: ${look} 3s ease-in-out infinite; }
            .${antenna} { animation: ${lean} 3s ease-in-out infinite; transform-origin: 128px 62px; }
            @keyframes ${wobble} {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-4deg); }
              75% { transform: rotate(4deg); }
            }
            @keyframes ${look} {
              0%, 70%, 100% { transform: translateX(0); }
              80% { transform: translateX(-4px); }
              90% { transform: translateX(4px); }
            }
            @keyframes ${lean} {
              0%, 100% { transform: rotate(0deg); }
              40% { transform: rotate(-12deg); }
              70% { transform: rotate(8deg); }
            }
          `}
        </style>
      </defs>
      <g className={bot}>
        <g className={antenna}>
          <rect x="122" y="28" width="12" height="34" rx="6" fill={`url(#${robotBlue})`} />
          <circle cx="128" cy="18" r="12" fill={`url(#${robotBlue})`} />
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
          d="M108 162 Q128 148 148 162"
          fill="none"
          stroke="#70E7FF"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

export { RobotLost }

import { useEffect, useId, useState, type RefObject } from "react"
import { motion } from "motion/react"

import { cn } from "../lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null>
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  curvature?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  repeat?: number
  repeatDelay?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

type BeamOffsets = {
  startXOffset: number
  startYOffset: number
  endXOffset: number
  endYOffset: number
  curvature: number
}

/** Pure path math for the curved beam between two element rects. */
export function computeBeamPath(
  containerRect: DOMRect,
  fromRect: DOMRect,
  toRect: DOMRect,
  offsets: BeamOffsets
): { width: number; height: number; d: string } {
  const startX =
    fromRect.left -
    containerRect.left +
    fromRect.width / 2 +
    offsets.startXOffset
  const startY =
    fromRect.top -
    containerRect.top +
    fromRect.height / 2 +
    offsets.startYOffset
  const endX =
    toRect.left - containerRect.left + toRect.width / 2 + offsets.endXOffset
  const endY =
    toRect.top - containerRect.top + toRect.height / 2 + offsets.endYOffset
  const controlY = startY - offsets.curvature
  return {
    width: containerRect.width,
    height: containerRect.height,
    d: `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`,
  }
}

function gradientCoordinatesFor(reverse: boolean) {
  return reverse
    ? {
        x1: ["90%", "-10%"],
        x2: ["100%", "0%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
    : {
        x1: ["10%", "110%"],
        x2: ["0%", "100%"],
        y1: ["0%", "0%"],
        y2: ["0%", "0%"],
      }
}

function useBeamPath(
  containerRef: RefObject<HTMLElement | null>,
  fromRef: RefObject<HTMLElement | null>,
  toRef: RefObject<HTMLElement | null>,
  curvature: number,
  startXOffset: number,
  startYOffset: number,
  endXOffset: number,
  endYOffset: number
) {
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updatePath = () => {
      const container = containerRef.current
      const from = fromRef.current
      const to = toRef.current
      if (!container || !from || !to) return

      const next = computeBeamPath(
        container.getBoundingClientRect(),
        from.getBoundingClientRect(),
        to.getBoundingClientRect(),
        { curvature, startXOffset, startYOffset, endXOffset, endYOffset }
      )
      setSvgDimensions({ width: next.width, height: next.height })
      setPathD(next.d)
    }

    const resizeObserver = new ResizeObserver(updatePath)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    updatePath()
    return () => resizeObserver.disconnect()
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  return { pathD, svgDimensions }
}

type BeamSvgProps = {
  className?: string
  pathD: string
  width: number
  height: number
  pathColor: string
  pathWidth: number
  pathOpacity: number
  gradientId: string
  gradientStartColor: string
  gradientStopColor: string
  reverse: boolean
  delay: number
  duration: number
  repeat: number
  repeatDelay: number
}

function BeamSvg({
  className,
  pathD,
  width,
  height,
  pathColor,
  pathWidth,
  pathOpacity,
  gradientId,
  gradientStartColor,
  gradientStopColor,
  reverse,
  delay,
  duration,
  repeat,
  repeatDelay,
}: BeamSvgProps) {
  const gradientCoordinates = gradientCoordinatesFor(reverse)
  return (
    <svg
      fill="none"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${gradientId})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat,
            repeatDelay,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  )
}

const BEAM_DEFAULTS = {
  curvature: 0,
  reverse: false,
  duration: 5,
  delay: 0,
  pathColor: "gray",
  pathWidth: 2,
  pathOpacity: 0.2,
  gradientStartColor: "#ffaa40",
  gradientStopColor: "#9c40ff",
  repeat: Infinity as number,
  repeatDelay: 0,
  startXOffset: 0,
  startYOffset: 0,
  endXOffset: 0,
  endYOffset: 0,
} as const

export function AnimatedBeam(props: AnimatedBeamProps) {
  const cfg = { ...BEAM_DEFAULTS, ...props }
  const id = useId()
  const { pathD, svgDimensions } = useBeamPath(
    cfg.containerRef,
    cfg.fromRef,
    cfg.toRef,
    cfg.curvature,
    cfg.startXOffset,
    cfg.startYOffset,
    cfg.endXOffset,
    cfg.endYOffset
  )

  return (
    <BeamSvg
      className={cfg.className}
      pathD={pathD}
      width={svgDimensions.width}
      height={svgDimensions.height}
      pathColor={cfg.pathColor}
      pathWidth={cfg.pathWidth}
      pathOpacity={cfg.pathOpacity}
      gradientId={id}
      gradientStartColor={cfg.gradientStartColor}
      gradientStopColor={cfg.gradientStopColor}
      reverse={cfg.reverse}
      delay={cfg.delay}
      duration={cfg.duration}
      repeat={cfg.repeat}
      repeatDelay={cfg.repeatDelay}
    />
  )
}

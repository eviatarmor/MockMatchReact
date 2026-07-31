"use client"

import { useEffect, useRef } from "react"

type NumberTickerProps = {
  end: number
  start?: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  formatNumber?: boolean
}

/**
 * Counts from `start` to `end`. Writes the formatted number via a DOM ref
 * so each rAF tick does not schedule a React re-render.
 */
export function NumberTicker({
  end,
  start = 0,
  duration = 2,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  formatNumber = false,
}: NumberTickerProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)

  const format = (value: number) => {
    const core = formatNumber
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toFixed(decimals)
    return `${prefix}${core}${suffix}`
  }

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    startTimeRef.current = null
    let frame = 0
    el.textContent = format(start)

    const animate = (timestamp: number) => {
      if (startTimeRef.current == null) startTimeRef.current = timestamp

      const progress = timestamp - startTimeRef.current
      const percent = Math.min(progress / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - percent, 3)
      const current = start + (end - start) * eased
      el.textContent = format(current)

      if (percent < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
    // format is pure over listed deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, duration, decimals, prefix, suffix, formatNumber])

  return (
    <span ref={spanRef} className={className}>
      {format(start)}
    </span>
  )
}

const NumberTickerDemo = () => {
  return (
    <div>
      <NumberTicker
        end={100}
        duration={4}
        className="text-3xl font-medium text-foreground sm:text-4xl lg:text-5xl"
      />
    </div>
  )
}

export default NumberTickerDemo

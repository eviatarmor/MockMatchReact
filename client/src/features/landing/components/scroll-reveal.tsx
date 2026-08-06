import type { ReactNode } from "react"
import { BlurFade } from "@mockmatch/ui/blur-fade"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  readonly children: ReactNode
  readonly className?: string
  readonly delay?: number
  readonly direction?: "up" | "down" | "left" | "right"
}

/** Scroll-triggered reveal via existing Magic UI BlurFade + Motion. */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  return (
    <BlurFade
      inView
      delay={delay}
      direction={direction}
      offset={12}
      className={cn(className)}
    >
      {children}
    </BlurFade>
  )
}

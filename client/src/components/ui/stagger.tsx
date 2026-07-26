import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { motion, type Transition } from "motion/react"
import { cn } from "@/lib/utils"

/** Shared fast list/grid cascade defaults (seconds). */
export const STAGGER = {
  /** Max items that receive a delayed entrance; later indices mount immediately. */
  count: 12,
  /** Delay between successive items. */
  delay: 0.04,
  duration: 0.22,
  distance: 10,
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const

export type StaggerDirection = "up" | "down" | "left" | "right"

export type StaggerAs = "div" | "tr" | "li"

export interface StaggerOptions {
  readonly count?: number
  readonly delay?: number
  readonly duration?: number
  readonly distance?: number
  readonly direction?: StaggerDirection
}

function offsetFor(
  direction: StaggerDirection,
  distance: number
): { x?: number; y?: number } {
  switch (direction) {
    case "up":
      return { y: distance }
    case "down":
      return { y: -distance }
    case "left":
      return { x: distance }
    case "right":
      return { x: -distance }
  }
}

/** Delay in seconds for index `i` (0 after `count`). */
export function staggerDelay(
  index: number,
  { count = STAGGER.count, delay = STAGGER.delay }: Pick<StaggerOptions, "count" | "delay"> = {}
): number {
  return index < count ? index * delay : 0
}

/** Motion transition for a staggered entrance. */
export function staggerTransition(
  index: number,
  options: StaggerOptions = {}
): Transition {
  const {
    count = STAGGER.count,
    delay = STAGGER.delay,
    duration = STAGGER.duration,
  } = options
  return {
    duration,
    ease: STAGGER.ease,
    delay: staggerDelay(index, { count, delay }),
  }
}

const motionTags = {
  div: motion.div,
  tr: motion.tr,
  li: motion.li,
} as const

type MotionDivProps = ComponentPropsWithoutRef<typeof motion.div>
type MotionTrProps = ComponentPropsWithoutRef<typeof motion.tr>
type MotionLiProps = ComponentPropsWithoutRef<typeof motion.li>

type StaggerItemBase = StaggerOptions & {
  readonly index: number
  readonly children: ReactNode
  readonly className?: string
  /**
   * When false, mounts already in the final state (no entrance).
   * Use for kanban/drag remounts where the item already appeared once.
   * Default true.
   */
  readonly entrance?: boolean
}

export type StaggerItemProps =
  | (StaggerItemBase & { readonly as?: "div" } & Omit<
      MotionDivProps,
      "children" | "initial" | "animate" | "transition"
    >)
  | (StaggerItemBase & { readonly as: "tr" } & Omit<
      MotionTrProps,
      "children" | "initial" | "animate" | "transition"
    >)
  | (StaggerItemBase & { readonly as: "li" } & Omit<
      MotionLiProps,
      "children" | "initial" | "animate" | "transition"
    >)

/**
 * One-shot entrance for list/table/grid items.
 * First `count` items cascade; later ones (e.g. infinite scroll) appear with no delay.
 *
 * Set `entrance={false}` when the same identity remounts (e.g. kanban column move)
 * so the cascade does not re-run.
 *
 * @example
 * ```tsx
 * {jobs.map((job, i) => (
 *   <StaggerItem key={job.id} index={i}>
 *     <JobCard job={job} />
 *   </StaggerItem>
 * ))}
 *
 * // Table rows (valid HTML — no wrapper div)
 * <StaggerItem as="tr" index={i} className="...">...</StaggerItem>
 *
 * // Horizontal template strip
 * <StaggerItem index={i} direction="left">...</StaggerItem>
 *
 * // Kanban: first paint only
 * <StaggerItem index={i} entrance={!seenIds.has(job.id)}>...</StaggerItem>
 * ```
 */
export function StaggerItem({
  index,
  as = "div",
  direction = "up",
  count = STAGGER.count,
  delay = STAGGER.delay,
  duration = STAGGER.duration,
  distance = STAGGER.distance,
  entrance = true,
  className,
  children,
  ...props
}: StaggerItemProps) {
  const Component = motionTags[as]
  const from = offsetFor(direction, distance)
  // Latch on mount — parent re-renders must not flip entrance mid-cascade
  // (e.g. kanban column sync) or the transition snaps to duration 0.
  const playEntrance = useRef(entrance).current

  return (
    <Component
      initial={playEntrance ? { opacity: 0, ...from } : false}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={
        playEntrance
          ? staggerTransition(index, { count, delay, duration })
          : { duration: 0 }
      }
      className={cn(className)}
      {...(props as object)}
    >
      {children}
    </Component>
  )
}

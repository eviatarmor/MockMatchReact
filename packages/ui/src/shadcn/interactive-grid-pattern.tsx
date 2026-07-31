import { useMemo, type SVGProps } from "react"

import { cn } from "../lib/utils"

/**
 * InteractiveGridPattern is a component that renders a grid pattern with interactive squares.
 *
 * @param width - The width of each square.
 * @param height - The height of each square.
 * @param squares - The number of squares in the grid. The first element is the number of horizontal squares, and the second element is the number of vertical squares.
 * @param className - The class name of the grid.
 * @param squaresClassName - The class name of the squares.
 */
interface InteractiveGridPatternProps extends SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  squares?: [number, number] // [horizontal, vertical]
  className?: string
  squaresClassName?: string
}

/** Soft cap — large grids (e.g. 80×80) create thousands of DOM nodes and tank paint. */
const MAX_AXIS = 40

/**
 * The InteractiveGridPattern component.
 *
 * Hover is pure CSS (`:hover`) — no React state — so pointer moves do not
 * re-render the full grid.
 *
 * @see InteractiveGridPatternProps for the props interface.
 * @returns A React component.
 */
export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const horizontal = Math.min(MAX_AXIS, Math.max(1, squares[0]))
  const vertical = Math.min(MAX_AXIS, Math.max(1, squares[1]))

  const cells = useMemo(() => {
    const total = horizontal * vertical
    const list: { index: number; x: number; y: number }[] = []
    list.length = total
    for (let index = 0; index < total; index++) {
      list[index] = {
        index,
        x: (index % horizontal) * width,
        y: Math.floor(index / horizontal) * height,
      }
    }
    return list
  }, [horizontal, vertical, width, height])

  return (
    <svg
      width={width * horizontal}
      height={height * vertical}
      // viewBox keeps hit-testing aligned when the SVG is stretched with CSS.
      viewBox={`0 0 ${width * horizontal} ${height * vertical}`}
      className={cn(
        "pointer-events-auto absolute inset-0 h-full w-full border border-current/30",
        className
      )}
      {...props}
    >
      {cells.map(({ index, x, y }) => (
        <rect
          key={index}
          x={x}
          y={y}
          width={width}
          height={height}
          // SVG default hit-testing ignores transparent fills — "all" keeps
          // empty cells hoverable (required for the interactive effect).
          pointerEvents="all"
          className={cn(
            "fill-transparent stroke-white/15 transition-[fill] duration-100 ease-in-out not-[&:hover]:duration-1000",
            // Default hover fill when caller does not override via squaresClassName
            "hover:fill-white/15",
            squaresClassName
          )}
        />
      ))}
    </svg>
  )
}

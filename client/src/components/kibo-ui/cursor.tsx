import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Kibo-style remote cursor pointer + label.
 * Installed as local component (registry: npx shadcn add @kibo-ui/cursor).
 */
export function Cursor({
  className,
  style,
  color = "#3B82F6",
  name,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  color?: string
  name?: string
  children?: ReactNode
}) {
  const labelStyle: CSSProperties = {
    backgroundColor: color,
    color: contrastText(color),
  }

  return (
    <div
      className={cn("pointer-events-none absolute z-50 select-none", className)}
      style={style}
      {...props}
    >
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        aria-hidden
        className="drop-shadow-sm"
      >
        <path
          d="M0.5 0.5L0.5 16.5L4.5 12.5L7.5 19L10 17.5L7 11L13 10.5L0.5 0.5Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      {(name || children) && (
        <div
          className="ml-3 mt-0.5 max-w-[10rem] truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight shadow-sm"
          style={labelStyle}
        >
          {name ?? children}
        </div>
      )}
    </div>
  )
}

function contrastText(hex: string): string {
  const raw = hex.replace("#", "")
  if (raw.length !== 6) return "#fff"
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111" : "#fff"
}

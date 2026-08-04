import type { ReactNode } from "react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { Kbd } from "@mockmatch/ui/kbd"
import { cn } from "@mockmatch/ui/utils"

export function RailButton({
  active,
  disabled,
  label,
  hotkey,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  label: string
  hotkey?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant={active ? "default" : "ghost"}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className="size-9 shrink-0"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <span>{label}</span>
        {hotkey ? <Kbd>{hotkey}</Kbd> : null}
      </TooltipContent>
    </Tooltip>
  )
}

export function SecondaryShell({
  ariaLabel,
  children,
}: {
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur"
      role="toolbar"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

export function ColorSwatch({
  color,
  active,
  disabled,
  onClick,
  rounded = "full",
}: {
  color: string
  active: boolean
  disabled?: boolean
  onClick: () => void
  rounded?: "full" | "sm"
}) {
  return (
    <button
      type="button"
      aria-label={color}
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "border border-black/10",
        rounded === "full" ? "size-5 rounded-full" : "size-6 rounded-sm shadow-sm",
        active && "ring-2 ring-blue-500 ring-offset-1",
        color === "#ffffff" && "border-neutral-300"
      )}
      style={{ backgroundColor: color }}
    />
  )
}

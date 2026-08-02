import type { LucideIcon } from "lucide-react"
import {
  ArrowUpRight,
  Hand,
  MousePointer2,
  StickyNote,
  Type,
  Pencil,
  Square,
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { Kbd } from "@mockmatch/ui/kbd"
import { cn } from "@mockmatch/ui/utils"
import type { ToolRailLabels, WhiteboardTool } from "./types"

const TOOLS: readonly {
  id: WhiteboardTool
  icon: LucideIcon
  hotkey: string
  labelKey: keyof ToolRailLabels
}[] = [
  { id: "select", icon: MousePointer2, hotkey: "V", labelKey: "select" },
  { id: "pan", icon: Hand, hotkey: "H", labelKey: "pan" },
  { id: "pen", icon: Pencil, hotkey: "P", labelKey: "pen" },
  { id: "sticky", icon: StickyNote, hotkey: "N", labelKey: "sticky" },
  { id: "text", icon: Type, hotkey: "T", labelKey: "text" },
  { id: "shape", icon: Square, hotkey: "S", labelKey: "shape" },
  { id: "connector", icon: ArrowUpRight, hotkey: "L", labelKey: "connector" },
]

export type WhiteboardToolRailProps = {
  readonly tool: WhiteboardTool
  readonly onToolChange: (tool: WhiteboardTool) => void
  readonly labels: ToolRailLabels
  readonly disabled?: boolean
  readonly className?: string
}

export function WhiteboardToolRail({
  tool,
  onToolChange,
  labels,
  disabled,
  className,
}: WhiteboardToolRailProps) {
  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "flex flex-col gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-md backdrop-blur",
          className
        )}
        role="toolbar"
        aria-label="Whiteboard tools"
      >
        {TOOLS.map(({ id, icon: Icon, hotkey, labelKey }) => {
          const active = tool === id
          const label = labels[labelKey]
          return (
            <Tooltip key={id}>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    size="icon"
                    variant={active ? "default" : "ghost"}
                    disabled={disabled}
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => onToolChange(id)}
                    className="size-9"
                  />
                }
              >
                <Icon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{label}</span>
                <Kbd>{hotkey}</Kbd>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export function toolFromHotkey(key: string): WhiteboardTool | null {
  const k = key.toLowerCase()
  if (k === "v" || k === "escape") return "select"
  if (k === "h") return "pan"
  if (k === "p") return "pen"
  if (k === "n") return "sticky"
  if (k === "t") return "text"
  if (k === "s") return "shape"
  if (k === "l") return "connector"
  return null
}

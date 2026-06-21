import type { ReactNode } from "react"
import { Sparkles, ArrowUp, ArrowDown, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BlockToolbarLabels {
  readonly ai: string
  readonly moveUp: string
  readonly moveDown: string
  readonly duplicate: string
  readonly delete: string
}

interface BlockToolbarProps {
  readonly canMoveUp: boolean
  readonly canMoveDown: boolean
  readonly onAi?: () => void
  readonly onMoveUp: () => void
  readonly onMoveDown: () => void
  readonly onDuplicate: () => void
  readonly onDelete: () => void
  readonly labels: BlockToolbarLabels
}

interface ActionProps {
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly danger?: boolean
  readonly children: ReactNode
}

function Action({ label, onClick, disabled, danger, children }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "pan-ignore flex size-7 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30",
        danger && "hover:bg-red-500/20 hover:text-red-400"
      )}
    >
      {children}
    </button>
  )
}

/** Floating per-block controls (AI / reorder / duplicate / delete). Document-agnostic. */
export function BlockToolbar({
  canMoveUp,
  canMoveDown,
  onAi,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  labels,
}: BlockToolbarProps) {
  return (
    <div className="pan-ignore flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 shadow-lg ring-1 ring-black/20">
      <Action label={labels.ai} onClick={() => onAi?.()}>
        <Sparkles className="size-4 text-blue-400" />
      </Action>
      <Action label={labels.moveUp} onClick={onMoveUp} disabled={!canMoveUp}>
        <ArrowUp className="size-4" />
      </Action>
      <Action label={labels.moveDown} onClick={onMoveDown} disabled={!canMoveDown}>
        <ArrowDown className="size-4" />
      </Action>
      <Action label={labels.duplicate} onClick={onDuplicate}>
        <Copy className="size-4" />
      </Action>
      <Action label={labels.delete} onClick={onDelete} danger>
        <Trash2 className="size-4" />
      </Action>
    </div>
  )
}

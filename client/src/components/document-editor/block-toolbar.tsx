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
        "pan-ignore flex size-7 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30",
        "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        "dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
        danger && "hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
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
    <div className="pan-ignore flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg ring-1 ring-black/5 dark:border-transparent dark:bg-neutral-900 dark:ring-black/20">
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

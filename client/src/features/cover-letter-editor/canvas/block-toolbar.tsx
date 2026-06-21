import { useTranslation } from "react-i18next"
import { Sparkles, ArrowUp, ArrowDown, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BlockToolbarProps {
  readonly canMoveUp: boolean
  readonly canMoveDown: boolean
  readonly onAi?: () => void
  readonly onMoveUp: () => void
  readonly onMoveDown: () => void
  readonly onDuplicate: () => void
  readonly onDelete: () => void
}

interface ActionProps {
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly danger?: boolean
  readonly children: React.ReactNode
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

/** Floating per-block controls (AI / reorder / duplicate / delete). */
export function BlockToolbar({
  canMoveUp,
  canMoveDown,
  onAi,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: BlockToolbarProps) {
  const { t } = useTranslation("cover-letter-editor")

  return (
    <div className="pan-ignore flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 shadow-lg ring-1 ring-black/20">
      <Action label={t("blockToolbar.ai")} onClick={() => onAi?.()}>
        <Sparkles className="size-4 text-blue-400" />
      </Action>
      <Action label={t("blockToolbar.moveUp")} onClick={onMoveUp} disabled={!canMoveUp}>
        <ArrowUp className="size-4" />
      </Action>
      <Action label={t("blockToolbar.moveDown")} onClick={onMoveDown} disabled={!canMoveDown}>
        <ArrowDown className="size-4" />
      </Action>
      <Action label={t("blockToolbar.duplicate")} onClick={onDuplicate}>
        <Copy className="size-4" />
      </Action>
      <Action label={t("blockToolbar.delete")} onClick={onDelete} danger>
        <Trash2 className="size-4" />
      </Action>
    </div>
  )
}

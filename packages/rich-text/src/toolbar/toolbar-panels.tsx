import type { LexicalEditor } from "lexical"
import { cn } from "@mockmatch/ui/utils"
import type { RichTextBlockType, RichTextLabels } from "../types"
import {
  applyBlockType,
  applyHighlight,
  applyTextColor,
  type ActiveFormats,
} from "../lib/formats"
import { ColorSwatchMenu } from "./color-swatch-menu"
import { blockTypeLabel } from "./block-label"

type Panel = "none" | "color" | "highlight" | "heading" | "link"

const HEADING_OPTIONS: readonly {
  readonly type: RichTextBlockType
  readonly key: keyof RichTextLabels
}[] = [
  { type: "paragraph", key: "paragraph" },
  { type: "h1", key: "heading1" },
  { type: "h2", key: "heading2" },
  { type: "h3", key: "heading3" },
]

export function ToolbarPanels({
  editor,
  labels,
  active,
  panel,
  compact,
  onClose,
}: {
  readonly editor: LexicalEditor
  readonly labels: RichTextLabels
  readonly active: ActiveFormats
  readonly panel: Panel
  readonly compact?: boolean
  readonly onClose: () => void
}) {
  if (panel === "color") {
    return (
      <ColorSwatchMenu
        kind="text"
        noneLabel={labels.colorNone ?? "Default"}
        activeColor={active.textColor}
        onPick={(color) => {
          editor.update(() => applyTextColor(color))
          onClose()
        }}
      />
    )
  }

  if (panel === "highlight") {
    return (
      <ColorSwatchMenu
        kind="highlight"
        noneLabel={labels.colorNone ?? "None"}
        activeColor={active.highlight}
        onPick={(color) => {
          editor.update(() => applyHighlight(color))
          onClose()
        }}
      />
    )
  }

  if (panel !== "heading" || compact) return null

  return (
    <div
      className="flex flex-col gap-0.5 p-0.5"
      onMouseDown={(e) => e.preventDefault()}
    >
      {HEADING_OPTIONS.map(({ type, key }) => (
        <button
          key={type}
          type="button"
          className={cn(
            "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
            "hover:bg-neutral-100 dark:hover:bg-white/10",
            active.blockType === type &&
              "bg-neutral-100 font-medium dark:bg-white/15"
          )}
          onClick={() => {
            applyBlockType(editor, type)
            onClose()
          }}
        >
          {labels[key]}
        </button>
      ))}
      <p className="px-2 pt-0.5 text-[10px] text-neutral-400">
        {blockTypeLabel(active.blockType, labels)}
      </p>
    </div>
  )
}

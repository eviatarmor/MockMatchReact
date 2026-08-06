import type { LexicalEditor, TextFormatType } from "lexical"
import { FORMAT_TEXT_COMMAND } from "lexical"
import {
  Bold,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  RemoveFormatting,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react"
import type { RichTextBlockType, RichTextLabels } from "../types"
import {
  applyBlockType,
  clearSelectionTextFormats,
  type ActiveFormats,
} from "../lib/formats"
import { ToolbarButton } from "./toolbar-button"

type Panel = "none" | "color" | "highlight" | "heading" | "link"

export function FormatButtons({
  editor,
  labels,
  active,
  panel,
  compact,
  onTogglePanel,
  onOpenLink,
}: {
  readonly editor: LexicalEditor
  readonly labels: RichTextLabels
  readonly active: ActiveFormats
  readonly panel: Panel
  readonly compact?: boolean
  readonly onTogglePanel: (panel: Panel) => void
  readonly onOpenLink: () => void
}) {
  const format = (type: TextFormatType) =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)

  const setBlock = (type: RichTextBlockType) => {
    applyBlockType(editor, type)
    onTogglePanel("none")
  }

  return (
    <>
      <ToolbarButton
        label={labels.bold}
        active={active.bold}
        onClick={() => format("bold")}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.italic}
        active={active.italic}
        onClick={() => format("italic")}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.underline}
        active={active.underline}
        onClick={() => format("underline")}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.strikethrough}
        active={active.strikethrough}
        onClick={() => format("strikethrough")}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-white/15" />

      <ToolbarButton
        label={labels.textColor}
        active={panel === "color" || active.textColor != null}
        onClick={() => onTogglePanel("color")}
      >
        <Palette className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.highlight}
        active={panel === "highlight" || active.highlight != null}
        onClick={() => onTogglePanel("highlight")}
      >
        <Highlighter className="size-4" />
      </ToolbarButton>

      <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-white/15" />

      {!compact && (
        <ToolbarButton
          label={labels.heading}
          active={panel === "heading" || active.blockType.startsWith("h")}
          onClick={() => onTogglePanel("heading")}
        >
          <Type className="size-4" />
        </ToolbarButton>
      )}
      <ToolbarButton
        label={labels.bulletList}
        active={active.blockType === "bullet"}
        onClick={() => setBlock("bullet")}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.orderedList}
        active={active.blockType === "number"}
        onClick={() => setBlock("number")}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.link}
        active={active.link}
        onClick={onOpenLink}
      >
        <Link className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.clear}
        onClick={() => editor.update(() => clearSelectionTextFormats())}
      >
        <RemoveFormatting className="size-4" />
      </ToolbarButton>
    </>
  )
}

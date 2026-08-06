import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
  type TextFormatType,
} from "lexical"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection"
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import { $findMatchingParent } from "@lexical/utils"
import { $isLinkNode } from "@lexical/link"
import type { RichTextBlockType } from "../types"

const TEXT_FORMATS: readonly TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
]

export type ActiveFormats = {
  readonly bold: boolean
  readonly italic: boolean
  readonly underline: boolean
  readonly strikethrough: boolean
  readonly link: boolean
  readonly textColor: string | null
  readonly highlight: string | null
  readonly blockType: RichTextBlockType
}

export function getSelectedLinkUrl(): string | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  const node = selection.anchor.getNode()
  const parent = node.getParent()
  if ($isLinkNode(parent)) return parent.getURL()
  if ($isLinkNode(node)) return node.getURL()
  return null
}

function readBlockType(): RichTextBlockType {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return "paragraph"
  const anchor = selection.anchor.getNode()
  const element =
    anchor.getKey() === "root"
      ? anchor
      : $findMatchingParent(anchor, (n) => {
          const parent = n.getParent()
          return parent !== null && parent.getKey() === "root"
        })

  if ($isListNode(element)) {
    return element.getListType() === "number" ? "number" : "bullet"
  }
  const listParent = $findMatchingParent(anchor, $isListNode)
  if ($isListNode(listParent)) {
    return listParent.getListType() === "number" ? "number" : "bullet"
  }
  if ($isHeadingNode(element)) {
    const tag = element.getTag()
    if (tag === "h1" || tag === "h2" || tag === "h3") return tag
  }
  return "paragraph"
}

/** Snapshot formats for toolbar active state. Must run inside editor read/update. */
export function readActiveFormats(): ActiveFormats | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  const textColor =
    $getSelectionStyleValueForProperty(selection, "color", "") || null
  const highlightRaw = $getSelectionStyleValueForProperty(
    selection,
    "background-color",
    ""
  )
  const highlight =
    highlightRaw && highlightRaw !== "transparent" ? highlightRaw : null
  return {
    bold: selection.hasFormat("bold"),
    italic: selection.hasFormat("italic"),
    underline: selection.hasFormat("underline"),
    strikethrough: selection.hasFormat("strikethrough"),
    link: getSelectedLinkUrl() !== null,
    textColor,
    highlight,
    blockType: readBlockType(),
  }
}

export function clearSelectionTextFormats(): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  for (const f of TEXT_FORMATS) {
    if (selection.hasFormat(f)) selection.toggleFormat(f)
  }
  $patchStyleText(selection, {
    color: null,
    "background-color": null,
  })
}

export function applyTextColor(color: string | null): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  $patchStyleText(selection, {
    color: color === "transparent" || color === "" ? null : color,
  })
}

export function applyHighlight(color: string | null): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  $patchStyleText(selection, {
    "background-color":
      color === "transparent" || color === "" || color == null
        ? null
        : color,
  })
}

export function applyBlockType(
  editor: LexicalEditor,
  type: RichTextBlockType
): void {
  if (type === "bullet") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    return
  }
  if (type === "number") {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    return
  }
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    if (type === "paragraph") {
      $setBlocksType(selection, () => $createParagraphNode())
      return
    }
    $setBlocksType(selection, () =>
      $createHeadingNode(type as HeadingTagType)
    )
  })
}

/** Normalize user link input (adds https:// when scheme missing). */
export function normalizeLinkUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:/i.test(trimmed)) return trimmed
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed
  return `https://${trimmed}`
}

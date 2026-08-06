import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type ElementFormatType,
  type LexicalEditor,
  type RangeSelection,
  type TextFormatType,
} from "lexical"
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { $setBlocksType } from "@lexical/selection"
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import { $createCodeNode } from "@lexical/code"
import { $isLinkNode } from "@lexical/link"
import { $findMatchingParent } from "@lexical/utils"
import type { BlockType } from "../types"
import { getSelectedBlockType } from "./toolbar-block-type"

export type ToolbarActiveFormats = {
  readonly bold: boolean
  readonly italic: boolean
  readonly underline: boolean
  readonly strikethrough: boolean
  readonly code: boolean
  readonly link: boolean
}

export type ToolbarSelectionSnapshot = {
  readonly active: ToolbarActiveFormats
  readonly blockType: BlockType
  readonly elementFormat: ElementFormatType
}

const TEXT_FORMATS: readonly TextFormatType[] = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
]

const LIST_BLOCK_TYPES: readonly BlockType[] = ["bullet", "number", "check"]

export function getSelectedLinkUrl(): string | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  const node = selection.anchor.getNode()
  const parent = node.getParent()
  if ($isLinkNode(parent)) return parent.getURL()
  if ($isLinkNode(node)) return node.getURL()
  return null
}

function readActiveFormats(selection: RangeSelection): ToolbarActiveFormats {
  return {
    bold: selection.hasFormat("bold"),
    italic: selection.hasFormat("italic"),
    underline: selection.hasFormat("underline"),
    strikethrough: selection.hasFormat("strikethrough"),
    code: selection.hasFormat("code"),
    link: getSelectedLinkUrl() !== null,
  }
}

function readElementFormat(selection: RangeSelection): ElementFormatType {
  const anchor = selection.anchor.getNode()
  const element = $isElementNode(anchor)
    ? anchor
    : $findMatchingParent(anchor, $isElementNode)
  if (!$isElementNode(element)) return "left"
  return element.getFormatType() || "left"
}

/** Snapshot selection formats / block type for toolbar UI state. */
export function readToolbarSelectionSnapshot(): ToolbarSelectionSnapshot | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  return {
    active: readActiveFormats(selection),
    blockType: getSelectedBlockType(),
    elementFormat: readElementFormat(selection),
  }
}

export function isListBlockType(
  type: BlockType
): type is "bullet" | "number" | "check" {
  return (LIST_BLOCK_TYPES as readonly string[]).includes(type)
}

function dispatchBulletOrNumber(
  editor: LexicalEditor,
  type: "bullet" | "number"
): void {
  if (type === "bullet") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    return
  }
  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
}

export function dispatchListBlockCommand(
  editor: LexicalEditor,
  type: "bullet" | "number" | "check"
): void {
  if (type === "check") {
    editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    return
  }
  dispatchBulletOrNumber(editor, type)
}

function createNodeForBlockType(type: BlockType) {
  if (type === "paragraph") return $createParagraphNode()
  if (type === "quote") return $createQuoteNode()
  if (type === "code") return $createCodeNode()
  return $createHeadingNode(type as HeadingTagType)
}

/** Apply paragraph / heading / quote / code via $setBlocksType (editor.update scope). */
export function applyNonListBlockType(type: BlockType): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  $setBlocksType(selection, () => createNodeForBlockType(type))
}

/** Toggle off active text formats on the current range selection. */
export function clearSelectionTextFormats(): void {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  for (const f of TEXT_FORMATS) {
    if (selection.hasFormat(f)) {
      selection.toggleFormat(f)
    }
  }
}

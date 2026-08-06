import {
  $getSelection,
  $isRangeSelection,
  type LexicalNode,
} from "lexical"
import { $isListNode, type ListNode } from "@lexical/list"
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text"
import { $isCodeNode } from "@lexical/code"
import { $findMatchingParent } from "@lexical/utils"
import type { BlockType } from "../types"

const HEADING_BLOCK_TAGS: readonly string[] = ["h1", "h2", "h3"]

function isRootChild(n: LexicalNode): boolean {
  const parent = n.getParent()
  return parent !== null && parent.getKey() === "root"
}

function getTopLevelFromAnchor(anchor: LexicalNode): LexicalNode {
  if (anchor.getKey() === "root") return anchor
  const matched = $findMatchingParent(anchor, isRootChild)
  if (matched !== null) return matched
  return anchor.getTopLevelElementOrThrow()
}

function blockTypeFromListType(
  listType: ReturnType<ListNode["getListType"]>
): BlockType {
  if (listType === "number") return "number"
  if (listType === "check") return "check"
  return "bullet"
}

function headingBlockType(element: LexicalNode): BlockType | null {
  if (!$isHeadingNode(element)) return null
  const tag = element.getTag()
  if (!HEADING_BLOCK_TAGS.includes(tag)) return null
  return tag as BlockType
}

function quoteOrCodeBlockType(element: LexicalNode): BlockType | null {
  if ($isQuoteNode(element)) return "quote"
  if ($isCodeNode(element)) return "code"
  return null
}

function listElementBlockType(element: LexicalNode): BlockType | null {
  if (!$isListNode(element)) return null
  return blockTypeFromListType(element.getListType())
}

function blockTypeFromElement(element: LexicalNode): BlockType | null {
  const heading = headingBlockType(element)
  if (heading !== null) return heading
  const simple = quoteOrCodeBlockType(element)
  if (simple !== null) return simple
  return listElementBlockType(element)
}

function blockTypeFromListAncestor(anchor: LexicalNode): BlockType | null {
  const listParent = $findMatchingParent(anchor, $isListNode)
  if (!listParent || !$isListNode(listParent)) return null
  return blockTypeFromListType(listParent.getListType())
}

/** Resolve current selection to a toolbar BlockType (Lexical playground pattern). */
export function getSelectedBlockType(): BlockType {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return "paragraph"

  const anchor = selection.anchor.getNode()
  const element = getTopLevelFromAnchor(anchor)
  const fromElement = blockTypeFromElement(element)
  if (fromElement !== null) return fromElement

  const fromList = blockTypeFromListAncestor(anchor)
  if (fromList !== null) return fromList

  return "paragraph"
}

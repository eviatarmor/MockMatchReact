import type { ElementFormatType } from "lexical"
import type { BlockType, PageEditorLabels } from "../types"

export type ToolbarBlockItem = {
  readonly value: BlockType
  readonly label: string
}

export type ToolbarChromeLabels = {
  readonly undo: string
  readonly redo: string
  readonly alignLeft: string
  readonly alignCenter: string
  readonly alignRight: string
  readonly alignJustify: string
  readonly clearFormatting: string
  readonly blockType: string
}

function pickLabel(value: string | undefined, fallback: string): string {
  return value ?? fallback
}

export function buildBlockItems(labels: PageEditorLabels): ToolbarBlockItem[] {
  return [
    { value: "paragraph", label: labels.paragraph },
    { value: "h1", label: labels.heading1 },
    { value: "h2", label: labels.heading2 },
    { value: "h3", label: labels.heading3 },
    { value: "bullet", label: labels.bulletList },
    { value: "number", label: labels.numberedList },
    { value: "check", label: labels.checkList },
    { value: "quote", label: labels.quote },
    { value: "code", label: labels.code },
  ]
}

function resolveAlignLabels(labels: PageEditorLabels) {
  return {
    alignLeft: pickLabel(labels.alignLeft, "Align left"),
    alignCenter: pickLabel(labels.alignCenter, "Align center"),
    alignRight: pickLabel(labels.alignRight, "Align right"),
    alignJustify: pickLabel(labels.alignJustify, "Justify"),
  }
}

function resolveHistoryLabels(labels: PageEditorLabels) {
  return {
    undo: pickLabel(labels.undo, "Undo"),
    redo: pickLabel(labels.redo, "Redo"),
  }
}

export function resolveToolbarChromeLabels(
  labels: PageEditorLabels
): ToolbarChromeLabels {
  return {
    ...resolveHistoryLabels(labels),
    ...resolveAlignLabels(labels),
    clearFormatting: pickLabel(labels.clearFormatting, "Clear formatting"),
    blockType: pickLabel(labels.blockType, "Block type"),
  }
}

export function isLeftOrDefaultAlign(format: ElementFormatType): boolean {
  return format === "left" || format === ""
}

export type ToolbarListActiveFlags = {
  readonly bullet: boolean
  readonly number: boolean
  readonly check: boolean
  readonly quote: boolean
}

export function listActiveFlags(blockType: BlockType): ToolbarListActiveFlags {
  return {
    bullet: blockType === "bullet",
    number: blockType === "number",
    check: blockType === "check",
    quote: blockType === "quote",
  }
}

export type ToolbarAlignActiveFlags = {
  readonly left: boolean
  readonly center: boolean
  readonly right: boolean
  readonly justify: boolean
}

export function alignActiveFlags(
  format: ElementFormatType
): ToolbarAlignActiveFlags {
  return {
    left: isLeftOrDefaultAlign(format),
    center: format === "center",
    right: format === "right",
    justify: format === "justify",
  }
}

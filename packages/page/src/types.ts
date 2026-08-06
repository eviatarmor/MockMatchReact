export type PageEditorLabels = {
  readonly bold: string
  readonly italic: string
  readonly underline: string
  readonly strikethrough: string
  readonly heading1: string
  readonly heading2: string
  readonly heading3: string
  readonly bulletList: string
  readonly numberedList: string
  readonly checkList: string
  readonly quote: string
  readonly code: string
  readonly divider: string
  readonly link: string
  readonly linkPrompt: string
  readonly paragraph: string
  readonly slashMenuAria: string
  readonly placeholder: string
  /** Block type select aria / group label */
  readonly blockType?: string
  readonly undo?: string
  readonly redo?: string
  readonly alignLeft?: string
  readonly alignCenter?: string
  readonly alignRight?: string
  readonly alignJustify?: string
  readonly clearFormatting?: string
  /** Link dialog */
  readonly linkDialogTitle?: string
  readonly linkDialogDescription?: string
  readonly linkUrlLabel?: string
  readonly linkApply?: string
  readonly linkRemove?: string
  readonly linkCancel?: string
}

export type PageShellLabels = {
  readonly canvasAria: string
}

export type SlashItemId =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code"
  | "divider"

export type SlashItem = {
  readonly id: SlashItemId
  readonly label: string
  readonly keywords: readonly string[]
}

/** Toolbar block-type select values (Lexical playground pattern). */
export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "number"
  | "check"
  | "quote"
  | "code"

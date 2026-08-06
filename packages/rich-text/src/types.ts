/** Block-level type for the heading selector. */
export type RichTextBlockType = "paragraph" | "h1" | "h2" | "h3" | "bullet" | "number"

/**
 * Host-supplied copy for toolbar controls.
 * Keep product strings out of this package — pass via labels.
 */
export type RichTextLabels = {
  readonly bold: string
  readonly italic: string
  readonly underline: string
  readonly strikethrough: string
  readonly textColor: string
  readonly highlight: string
  readonly link: string
  readonly linkApply: string
  readonly linkPlaceholder: string
  readonly linkRemove?: string
  readonly heading: string
  readonly paragraph: string
  readonly heading1: string
  readonly heading2: string
  readonly heading3: string
  readonly bulletList: string
  readonly orderedList: string
  readonly clear: string
  readonly colorNone?: string
}

/** Compact / full surface modes. */
export type RichTextVariant = "default" | "compact"

/**
 * Local caret snapshot for collab presence (host transport).
 * Coordinates are **viewport** CSS px relative to the editor root.
 */
export type RichTextCaretSnapshot = {
  readonly fieldId: string
  readonly anchorOffset: number
  readonly focusOffset: number
  /** Caret bar top-left relative to editor root. */
  readonly x: number
  readonly y: number
  readonly height: number
  /** Optional multi-rect selection highlight (root-relative). */
  readonly rects?: readonly {
    readonly x: number
    readonly y: number
    readonly w: number
    readonly h: number
  }[]
}

/** Remote peer caret for overlay render. */
export type RichTextRemoteCaret = {
  readonly userId: string
  readonly name: string
  /** Hex color, e.g. `#3B82F6`. */
  readonly color: string
  readonly x: number
  readonly y: number
  readonly height: number
  readonly rects?: readonly {
    readonly x: number
    readonly y: number
    readonly w: number
    readonly h: number
  }[]
}

export type RichTextCollabCarets = {
  /** Stable id for this field on the shared room (multi-field docs). */
  readonly fieldId: string
  /** Remote peers currently editing this field. */
  readonly peers?: readonly RichTextRemoteCaret[]
  /**
   * Called when local selection/caret moves (throttled by host if needed).
   * Host publishes via presence / Yjs awareness — package does not own transport.
   */
  readonly onLocalCaretChange?: (caret: RichTextCaretSnapshot | null) => void
}

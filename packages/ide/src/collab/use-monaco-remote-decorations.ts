import { useEffect, useRef } from "react"
import * as monaco from "monaco-editor"
import type { CollabPeer } from "@mockmatch/collab"
import {
  collabCaretBoxShadow,
  collabSelectionBackground,
  collabSolidColor,
} from "@mockmatch/collab"

const STYLE_ID = "mm-ide-collab-decorations"

/**
 * Peer paint CSS — mirrors resume-editor RemoteCursors:
 * selection @ 0.28 opacity, 2px caret + soft glow, 9px name chip.
 */
function ensurePeerStyles(peers: readonly CollabPeer[]) {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement("style")
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  const rules: string[] = [
    // Shared caret pulse (same feel as resume w-0.5 animate-pulse bar)
    `@keyframes mm-collab-caret-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }`,
  ]
  for (const p of peers) {
    const id = cssSafeId(p.userId)
    const solid = collabSolidColor(p.color)
    const selBg = collabSelectionBackground(p.color)
    const glow = collabCaretBoxShadow(p.color)
    rules.push(
      // Selection highlight — rgba at COLLAB_SELECTION_OPACITY (0.28)
      `.mm-collab-sel-${id} {` +
        `background-color: ${selBg} !important;` +
        `border-radius: 2px;` +
        `}`,
      // Caret bar — 2px (= Tailwind w-0.5), solid peer color + soft ring
      `.mm-collab-caret-${id} {` +
        `border-left: 2px solid ${solid} !important;` +
        `margin-left: -1px;` +
        `box-shadow: ${glow};` +
        `animation: mm-collab-caret-pulse 1.2s ease-in-out infinite;` +
        `}`,
      // Name chip — resume: text-[9px] rounded px-1 py-px text-white shadow-sm
      `.mm-collab-name-${id} {` +
        `background-color: ${solid} !important;` +
        `color: #fff !important;` +
        `font-size: 9px !important;` +
        `font-weight: 500 !important;` +
        `font-family: system-ui, sans-serif !important;` +
        `line-height: 1.25 !important;` +
        `padding: 1px 4px !important;` +
        `border-radius: 2px !important;` +
        `margin-left: 2px !important;` +
        `white-space: nowrap !important;` +
        `pointer-events: none !important;` +
        `box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);` +
        `}`
    )
  }
  style.textContent = rules.join("\n")
}

function cssSafeId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_")
}

export type UseMonacoRemoteDecorationsOptions = {
  readonly editor: monaco.editor.IStandaloneCodeEditor | null
  readonly peers: readonly CollabPeer[]
  readonly path: string
  readonly selfUserId?: string
  readonly enabled?: boolean
}

/**
 * Remote carets + selections via Monaco createDecorationsCollection.
 * Only peers with cursor.path matching this model are shown.
 */
export function useMonacoRemoteDecorations({
  editor,
  peers,
  path,
  selfUserId,
  enabled = true,
}: UseMonacoRemoteDecorationsOptions) {
  const collectionRef =
    useRef<monaco.editor.IEditorDecorationsCollection | null>(null)

  useEffect(() => {
    if (!editor || !enabled) {
      collectionRef.current?.clear()
      return
    }

    if (!collectionRef.current) {
      collectionRef.current = editor.createDecorationsCollection()
    }
    const collection = collectionRef.current

    ensurePeerStyles(peers)

    const decorations: monaco.editor.IModelDeltaDecoration[] = []

    for (const peer of peers) {
      if (selfUserId && peer.userId === selfUserId) continue
      const cursor = peer.cursor
      if (!cursor?.path || cursor.path !== path) continue
      if (cursor.kind !== "caret" && cursor.kind !== "selection") continue
      const sel = cursor.sel
      if (!sel) continue

      const id = cssSafeId(peer.userId)
      const range = new monaco.Range(
        sel.startLineNumber,
        sel.startColumn,
        sel.endLineNumber,
        sel.endColumn
      )

      if (cursor.kind === "selection" && !range.isEmpty()) {
        decorations.push({
          range,
          options: {
            className: `mm-collab-sel-${id}`,
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        })
      }

      // Caret at selection head (end position)
      const caretRange = new monaco.Range(
        sel.endLineNumber,
        sel.endColumn,
        sel.endLineNumber,
        sel.endColumn
      )
      decorations.push({
        range: caretRange,
        options: {
          className: `mm-collab-caret-${id}`,
          after: {
            content: peer.name,
            inlineClassName: `mm-collab-name-${id}`,
          },
          stickiness:
            monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })
    }

    collection.set(decorations)
  }, [editor, peers, path, selfUserId, enabled])

  useEffect(() => {
    return () => {
      collectionRef.current?.clear()
      collectionRef.current = null
    }
  }, [editor])
}

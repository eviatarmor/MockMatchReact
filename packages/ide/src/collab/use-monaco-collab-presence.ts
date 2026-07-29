import { useEffect, useRef } from "react"
import type * as monaco from "monaco-editor"
import type { SendCursor } from "@mockmatch/collab"

const CARET_THROTTLE_MS = 24
const POINTER_THROTTLE_MS = 40

export type UseMonacoCollabPresenceOptions = {
  readonly editor: monaco.editor.IStandaloneCodeEditor | null
  readonly path: string
  readonly sendCursor: SendCursor
  readonly clearCursor?: () => void
  readonly enabled?: boolean
}

/**
 * Broadcast local Monaco caret/selection + mouse pointer for collab presence.
 * Peers render carets via decorations; pointer via DOM overlay.
 */
export function useMonacoCollabPresence({
  editor,
  path,
  sendCursor,
  clearCursor,
  enabled = true,
}: UseMonacoCollabPresenceOptions) {
  const sendRef = useRef(sendCursor)
  sendRef.current = sendCursor
  const clearRef = useRef(clearCursor)
  clearRef.current = clearCursor
  const pathRef = useRef(path)
  pathRef.current = path
  const lastSent = useRef(0)

  useEffect(() => {
    if (!editor || !enabled) return

    const dom = editor.getDomNode()
    if (!dom) return

    const reportSelection = () => {
      const sel = editor.getSelection()
      if (!sel) return
      const model = editor.getModel()
      if (!model) return

      const collapsed = sel.isEmpty()
      const kind = collapsed ? "caret" : "selection"
      const pos = sel.getPosition()
      const visible = editor.getScrolledVisiblePosition(pos)
      const layout = editor.getLayoutInfo()
      const w = Math.max(1, layout.width)
      const h = Math.max(1, layout.height)

      let x = 0.5
      let y = 0.5
      let caretH = 16
      if (visible) {
        x = Math.min(4, Math.max(-4, visible.left / w))
        y = Math.min(4, Math.max(-4, visible.top / h))
        caretH = Math.max(8, visible.height || 16)
      }

      const now = Date.now()
      if (now - lastSent.current < CARET_THROTTLE_MS) return
      lastSent.current = now

      sendRef.current(
        x,
        y,
        kind,
        caretH,
        undefined,
        {
          path: pathRef.current,
          sel: {
            startLineNumber: sel.startLineNumber,
            startColumn: sel.startColumn,
            endLineNumber: sel.endLineNumber,
            endColumn: sel.endColumn,
          },
        }
      )
    }

    const onPointerMove = (e: PointerEvent) => {
      // Prefer caret while typing in editor; pointer only when not selecting text actively
      const active = document.activeElement
      if (dom.contains(active) && editor.hasTextFocus()) {
        // Still allow pointer when moving mouse without focused caret intent —
        // report pointer only if no recent selection change priority
      }
      const rect = dom.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const now = Date.now()
      if (now - lastSent.current < POINTER_THROTTLE_MS) return
      // Don't clobber high-rate caret while dragging selection
      if (e.buttons === 1 && editor.hasTextFocus()) return
      lastSent.current = now
      sendRef.current(x, y, "pointer", undefined, undefined, {
        path: pathRef.current,
      })
    }

    const onPointerLeave = () => {
      clearRef.current?.()
    }

    const selSub = editor.onDidChangeCursorSelection(() => {
      reportSelection()
    })
    const focusSub = editor.onDidFocusEditorText(() => {
      reportSelection()
    })
    const blurSub = editor.onDidBlurEditorText(() => {
      // Keep last caret visible for peers; only clear on leave of surface
    })

    dom.addEventListener("pointermove", onPointerMove)
    dom.addEventListener("pointerleave", onPointerLeave)

    reportSelection()

    return () => {
      selSub.dispose()
      focusSub.dispose()
      blurSub.dispose()
      dom.removeEventListener("pointermove", onPointerMove)
      dom.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [editor, enabled, path])
}

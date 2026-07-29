import { useEffect, useState } from "react"
import type * as monaco from "monaco-editor"

import type { MonacoEditorCollabProps } from "./types"
import { useMonacoCollabPresence } from "./use-monaco-collab-presence"
import { useMonacoRemoteDecorations } from "./use-monaco-remote-decorations"
import { useMonacoYBinding } from "./use-monaco-y-binding"

/**
 * Compose presence + remote decorations + optional Y.Text binding for one Monaco.
 */
export function useMonacoCollab(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  collab?: MonacoEditorCollabProps | null
) {
  const enabled = Boolean(collab?.enabled ?? collab)
  const path = collab?.path ?? ""

  useMonacoCollabPresence({
    editor,
    path,
    sendCursor: collab?.sendCursor ?? (() => {}),
    clearCursor: collab?.clearCursor,
    enabled: enabled && Boolean(collab?.sendCursor),
  })

  useMonacoRemoteDecorations({
    editor,
    peers: collab?.peers ?? [],
    path,
    selfUserId: collab?.selfUserId,
    enabled,
  })

  useMonacoYBinding({
    editor,
    yText: collab?.yText,
    enabled: enabled && Boolean(collab?.yText),
    readOnly: collab?.readOnly,
  })

  // Surface size for pointer overlay
  const [surfaceSize, setSurfaceSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    if (!editor || !enabled) return
    const dom = editor.getDomNode()
    if (!dom) return
    const measure = () => {
      const r = dom.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        setSurfaceSize({ w: r.width, h: r.height })
      }
    }
    const ro = new ResizeObserver(measure)
    ro.observe(dom)
    measure()
    return () => ro.disconnect()
  }, [editor, enabled])

  return { surfaceSize, enabled }
}

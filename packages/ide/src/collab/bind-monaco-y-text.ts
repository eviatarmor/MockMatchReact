import * as monaco from "monaco-editor"
import type * as Y from "yjs"

export const MONACO_Y_ORIGIN = "monaco-local"
export const MONACO_Y_REMOTE = "monaco-remote"

/**
 * Two-way bind a Monaco model to a Y.Text without full setValue on remote.
 * Returns dispose().
 */
export function bindMonacoYText(
  model: monaco.editor.ITextModel,
  yText: Y.Text,
  opts?: { readonly readOnly?: boolean }
): () => void {
  let applyingRemote = false
  let applyingLocal = false

  // Seed model from Y if Y has content and model differs
  const yValue = yText.toString()
  if (model.getValue() !== yValue) {
    applyingRemote = true
    model.setValue(yValue)
    applyingRemote = false
  }

  const modelSub = model.onDidChangeContent((e) => {
    if (applyingRemote || opts?.readOnly) return
    applyingLocal = true
    yText.doc?.transact(() => {
      // Apply Monaco changes as sequential Y.Text ops (reverse order for correct offsets)
      const changes = [...e.changes].sort(
        (a, b) => b.rangeOffset - a.rangeOffset
      )
      for (const change of changes) {
        if (change.rangeLength > 0) {
          yText.delete(change.rangeOffset, change.rangeLength)
        }
        if (change.text.length > 0) {
          yText.insert(change.rangeOffset, change.text)
        }
      }
    }, MONACO_Y_ORIGIN)
    applyingLocal = false
  })

  const yObserver = (event: Y.YTextEvent, transaction: Y.Transaction) => {
    if (applyingLocal) return
    if (transaction.origin === MONACO_Y_ORIGIN) return

    applyingRemote = true
    try {
      let index = 0
      const edits: monaco.editor.IIdentifiedSingleEditOperation[] = []
      for (const delta of event.delta) {
        if (delta.retain != null) {
          index += delta.retain
        } else if (delta.delete != null) {
          const start = model.getPositionAt(index)
          const end = model.getPositionAt(index + delta.delete)
          edits.push({
            range: new monaco.Range(
              start.lineNumber,
              start.column,
              end.lineNumber,
              end.column
            ),
            text: "",
            forceMoveMarkers: true,
          })
        } else if (delta.insert != null) {
          const text =
            typeof delta.insert === "string"
              ? delta.insert
              : String(delta.insert)
          const pos = model.getPositionAt(index)
          edits.push({
            range: new monaco.Range(
              pos.lineNumber,
              pos.column,
              pos.lineNumber,
              pos.column
            ),
            text,
            forceMoveMarkers: true,
          })
          index += text.length
        }
      }
      if (edits.length > 0) {
        model.pushEditOperations([], edits, () => null)
      }
    } finally {
      applyingRemote = false
    }
  }

  yText.observe(yObserver)

  return () => {
    modelSub.dispose()
    yText.unobserve(yObserver)
  }
}

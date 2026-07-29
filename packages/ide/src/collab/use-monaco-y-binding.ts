import { useEffect } from "react"
import type * as monaco from "monaco-editor"
import type * as Y from "yjs"

import { bindMonacoYText } from "./bind-monaco-y-text"

export type UseMonacoYBindingOptions = {
  readonly editor: monaco.editor.IStandaloneCodeEditor | null
  readonly yText?: Y.Text | null
  readonly enabled?: boolean
  readonly readOnly?: boolean
}

/** Bind active editor model to Y.Text while mounted. */
export function useMonacoYBinding({
  editor,
  yText,
  enabled = true,
  readOnly = false,
}: UseMonacoYBindingOptions) {
  useEffect(() => {
    if (!editor || !yText || !enabled) return
    const model = editor.getModel()
    if (!model) return
    return bindMonacoYText(model, yText, { readOnly })
  }, [editor, yText, enabled, readOnly])
}

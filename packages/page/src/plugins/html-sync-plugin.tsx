import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  type LexicalEditor,
} from "lexical"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"

const REMOTE_TAG = "page-remote"

function applyHtml(editor: LexicalEditor, html: string) {
  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const source = html ?? ""
      if (!source.trim()) {
        $setSelection(null)
        return
      }
      const dom = new DOMParser().parseFromString(source, "text/html")
      const nodes = $generateNodesFromDOM(editor, dom)
      if (nodes.length > 0) {
        root.select()
        $insertNodes(nodes)
      }
      $setSelection(null)
    },
    { tag: REMOTE_TAG }
  )
}

export function HtmlSyncPlugin({
  html,
  onChange,
  disabled,
}: {
  readonly html: string
  readonly onChange?: (html: string) => void
  readonly disabled?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (disabled) return
    if (last.current === html) return
    last.current = html
    applyHtml(editor, html)
  }, [disabled, editor, html])

  if (!onChange || disabled) return null

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(state, ed) => {
        // Skip remote applies
        void state
        ed.read(() => {
          const next = $generateHtmlFromNodes(ed, null)
          if (next === last.current) return
          last.current = next
          onChange(next)
        })
      }}
    />
  )
}

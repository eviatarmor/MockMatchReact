import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  type LexicalEditor,
} from "lexical"
import { EXTERNAL_HTML_TAG } from "../constants"

function applyHtmlToEditor(editor: LexicalEditor, html: string) {
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
    { tag: EXTERNAL_HTML_TAG }
  )
}

/**
 * Keep Lexical in sync with a controlled HTML `value` prop.
 * Skips apply when editor already matches (avoids selection thrash).
 */
export function HtmlSyncPlugin({
  html,
  disabled,
}: {
  readonly html: string
  readonly disabled?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
    if (disabled) return
    const next = html ?? ""
    if (lastSynced.current === next) return

    let current = ""
    editor.read(() => {
      current = $generateHtmlFromNodes(editor, null)
    })
    if (current === next) {
      lastSynced.current = next
      return
    }

    lastSynced.current = next
    applyHtmlToEditor(editor, next)
  }, [html, editor, disabled])

  return null
}

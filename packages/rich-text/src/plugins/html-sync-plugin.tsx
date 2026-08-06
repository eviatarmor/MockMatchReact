import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { readEditorHtml, seedEditorFromHtml } from "../lib/editor-html"

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
    if (readEditorHtml(editor) === next) {
      lastSynced.current = next
      return
    }
    lastSynced.current = next
    seedEditorFromHtml(editor, next)
  }, [html, editor, disabled])

  return null
}

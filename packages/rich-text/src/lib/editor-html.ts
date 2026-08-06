import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  type LexicalEditor,
} from "lexical"
import { EXTERNAL_HTML_TAG } from "../constants"

/**
 * Apply HTML into the current editor update (must run inside editorState /
 * editor.update). Clears the root and inserts parsed nodes.
 */
export function $applyHtml(editor: LexicalEditor, html: string): void {
  const root = $getRoot()
  root.clear()
  const payload = html ?? ""
  if (!payload.trim()) {
    $setSelection(null)
    return
  }
  const parsed = new DOMParser().parseFromString(payload, "text/html")
  const next = $generateNodesFromDOM(editor, parsed)
  if (next.length === 0) {
    $setSelection(null)
    return
  }
  root.select()
  $insertNodes(next)
  $setSelection(null)
}

/** Replace editor tree from HTML string (external controlled value). */
export function seedEditorFromHtml(
  editor: LexicalEditor,
  html: string,
  tag: string = EXTERNAL_HTML_TAG
): void {
  editor.update(() => $applyHtml(editor, html), { tag })
}

export function readEditorHtml(editor: LexicalEditor): string {
  let html = ""
  editor.read(() => {
    html = $generateHtmlFromNodes(editor, null)
  })
  return html
}

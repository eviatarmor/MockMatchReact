import { useEffect } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { ListNode, ListItemNode } from "@lexical/list"
import { LinkNode } from "@lexical/link"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { $getRoot, $insertNodes, type LexicalEditor } from "lexical"
import { cn } from "@/lib/utils"
import { FloatingTextToolbar, type RichTextToolbarLabels } from "./rich-text-toolbar"

interface RichTextFieldProps {
  /** Initial HTML. Treated as uncontrolled after mount — `onChange` is the source of truth. */
  readonly value: string
  readonly onChange?: (html: string) => void
  readonly readOnly?: boolean
  readonly placeholder?: string
  readonly className?: string
  readonly ariaLabel?: string
  readonly labels: RichTextToolbarLabels
}

const theme = {
  paragraph: "m-0",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
  list: { ul: "list-disc pl-5", listitem: "" },
  link: "text-blue-600 underline",
}

/**
 * Blur the editor when a pointer goes down outside it. The zoom/pan canvas
 * preventDefaults pointerdown for panning, which otherwise suppresses the native
 * blur, leaving fields stuck focused. The floating toolbar is excluded.
 */
function BlurOnOutsidePointer() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const handler = (event: PointerEvent) => {
      const root = editor.getRootElement()
      if (!root || document.activeElement !== root) return
      const target = event.target as Node | null
      if (root.contains(target)) return
      if (target instanceof Element && target.closest("[data-rte-toolbar]")) return
      root.blur()
    }
    document.addEventListener("pointerdown", handler, true)
    return () => document.removeEventListener("pointerdown", handler, true)
  }, [editor])
  return null
}

/** Seed the editor from an HTML string on first mount. */
function seedFromHtml(editor: LexicalEditor, html: string) {
  const root = $getRoot()
  if (root.getFirstChild()) return
  const dom = new DOMParser().parseFromString(html ?? "", "text/html")
  const nodes = $generateNodesFromDOM(editor, dom)
  root.select()
  $insertNodes(nodes)
}

/**
 * Rich-text field that drops in where a plain textarea would go: transparent,
 * inherits surrounding typography via `className`, and shows a floating format
 * toolbar (bold/italic/underline/list/link/clear) on text selection. Stores and
 * emits HTML so the document schema stays a simple string. Document-agnostic —
 * reuse for résumés, letters, or any editable prose.
 */
export function RichTextField({
  value,
  onChange,
  readOnly,
  placeholder,
  className,
  ariaLabel,
  labels,
}: RichTextFieldProps) {
  if (readOnly || !onChange) {
    if (!value) return null
    return <div className={cn("whitespace-pre-wrap", className)} dangerouslySetInnerHTML={{ __html: value }} />
  }

  const initialConfig = {
    namespace: "rich-text-field",
    editable: true,
    theme,
    nodes: [ListNode, ListItemNode, LinkNode],
    onError: (error: Error) => {
      throw error
    },
    editorState: (editor: LexicalEditor) => seedFromHtml(editor, value),
  }

  const handleChange = (_: unknown, editor: LexicalEditor) => {
    editor.read(() => onChange($generateHtmlFromNodes(editor, null)))
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              className={cn("pan-ignore cursor-text whitespace-pre-wrap outline-none", className)}
            />
          }
          placeholder={
            <div className={cn("pointer-events-none absolute left-0 top-0 select-none text-neutral-300", className)}>
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <FloatingTextToolbar labels={labels} />
        <BlurOnOutsidePointer />
      </div>
    </LexicalComposer>
  )
}

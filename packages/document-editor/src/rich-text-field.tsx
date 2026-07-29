import { useEffect, useId, useMemo, useRef } from "react"
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
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  type EditorState,
  type LexicalEditor,
} from "lexical"
import { isBlankHtml } from "./lib/blank-html"
import { cn } from "@mockmatch/ui/utils"
import { FloatingTextToolbar, type RichTextToolbarLabels } from "./rich-text-toolbar"
import { useDocumentAiAssist } from "./ai-assist-context"
import { LexicalGrammarPlugin } from "./grammar/lexical-grammar-plugin"
import type { GrammarPopoverLabels } from "./grammar/grammar-popover"

/** Tag so OnChange ignores programmatic collab/external applies (no rebroadcast loops). */
const COLLAB_REMOTE_TAG = "collab-remote"

interface RichTextFieldProps {
  /** Controlled HTML. Collab peers update this → editor re-syncs in place. */
  readonly value: string
  readonly onChange?: (html: string) => void
  readonly readOnly?: boolean
  readonly placeholder?: string
  readonly className?: string
  readonly ariaLabel?: string
  readonly labels: RichTextToolbarLabels
  readonly grammar?: boolean
  readonly grammarLabels?: GrammarPopoverLabels
  readonly analysisTarget?: string
  /** Selection → AI assistant (attachment). */
  readonly onAiAssist?: (selectedText: string) => void
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
      editor.update(() => $setSelection(null))
    }
    document.addEventListener("pointerdown", handler, true)
    return () => document.removeEventListener("pointerdown", handler, true)
  }, [editor])
  return null
}

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
    { tag: COLLAB_REMOTE_TAG }
  )
}

/**
 * Keep Lexical in sync with the controlled `value` prop (collab peer edits).
 * Tags updates as collab-remote so OnChange does not re-emit / rebroadcast.
 */
function ExternalHtmlSyncPlugin({ html }: { readonly html: string }) {
  const [editor] = useLexicalComposerContext()
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
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
  }, [html, editor])

  return null
}

/**
 * Rich-text field: transparent Lexical editor. Controlled `value` so collab
 * peers can push HTML and it appears live.
 */
export function RichTextField({
  value: valueProp,
  onChange,
  readOnly,
  placeholder,
  className,
  ariaLabel,
  labels,
  grammar,
  grammarLabels,
  analysisTarget,
  onAiAssist,
}: RichTextFieldProps) {
  const contextAiAssist = useDocumentAiAssist()
  const resolvedAiAssist = onAiAssist ?? contextAiAssist ?? undefined
  const value = valueProp ?? ""
  const reactId = useId()
  // Unique namespace per instance — shared namespace broke multi-field + collab state
  const namespace = analysisTarget
    ? `rtf:${analysisTarget}`
    : `rtf:${reactId}`

  const initialConfig = useMemo(
    () => ({
      namespace,
      editable: true as const,
      theme,
      nodes: [ListNode, ListItemNode, LinkNode],
      onError: (error: Error) => {
        throw error
      },
      editorState: (editor: LexicalEditor) => {
        // Always write seed — do not bail if Lexical already created an empty paragraph
        const root = $getRoot()
        root.clear()
        const source = value
        if (!source.trim()) return
        const dom = new DOMParser().parseFromString(source, "text/html")
        const nodes = $generateNodesFromDOM(editor, dom)
        if (nodes.length > 0) {
          root.select()
          $insertNodes(nodes)
        }
        $setSelection(null)
      },
    }),
    // value intentionally omitted — ExternalHtmlSyncPlugin owns live updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace]
  )

  if (readOnly || !onChange) {
    if (isBlankHtml(value)) return null
    return (
      <div
        className={cn("whitespace-pre-wrap", className)}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    )
  }

  const handleChange = (
    _editorState: EditorState,
    editor: LexicalEditor,
    tags?: Set<string>
  ) => {
    if (tags?.has(COLLAB_REMOTE_TAG)) return
    editor.read(() => onChange($generateHtmlFromNodes(editor, null)))
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className="relative"
        {...(analysisTarget ? { "data-analysis-target": analysisTarget } : {})}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              className={cn(
                "pan-ignore cursor-text whitespace-pre-wrap outline-none",
                className
              )}
            />
          }
          placeholder={
            <div
              className={cn(
                "pointer-events-none absolute left-0 top-0 select-none text-neutral-300",
                className
              )}
            >
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <ExternalHtmlSyncPlugin html={value} />
        <FloatingTextToolbar
          labels={labels}
          onAiAssist={resolvedAiAssist}
        />
        <BlurOnOutsidePointer />
        {grammar && grammarLabels && (
          <LexicalGrammarPlugin labels={grammarLabels} />
        )}
      </div>
    </LexicalComposer>
  )
}

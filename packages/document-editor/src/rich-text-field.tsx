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
import { useDocumentYjs } from "./document-yjs-context"
import { LexicalYjsPlugin } from "./lexical-yjs-plugin"

/** Tag so OnChange ignores programmatic collab/external applies (no rebroadcast loops). */
const COLLAB_REMOTE_TAG = "collab-remote"

interface RichTextFieldProps {
  /** Controlled HTML. Collab peers update this → editor re-syncs in place (non-Yjs path). */
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
  /**
   * Stable id for Lexical↔Yjs binding. Defaults to `analysisTarget`.
   * Required for multi-field collab (unique per field on the shared Y.Doc).
   */
  readonly collabFieldId?: string
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
 * Keep Lexical in sync with the controlled `value` prop (non-Yjs collab / external).
 * Disabled when LexicalYjsPlugin owns the editor state.
 */
function ExternalHtmlSyncPlugin({
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

/**
 * Rich-text field: transparent Lexical editor.
 * With {@link DocumentYjsProvider} + field id → @lexical/yjs Binding V2 on the shared room doc.
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
  collabFieldId,
  onAiAssist,
}: RichTextFieldProps) {
  const contextAiAssist = useDocumentAiAssist()
  const resolvedAiAssist = onAiAssist ?? contextAiAssist ?? undefined
  const value = valueProp ?? ""
  const reactId = useId()
  const fieldId = collabFieldId ?? analysisTarget
  const yjsCtx = useDocumentYjs()
  const yjsEnabled = Boolean(yjsCtx.enabled && yjsCtx.ydoc && fieldId)

  // Unique namespace per instance — shared namespace broke multi-field + collab state
  const namespace = fieldId
    ? `rtf:${fieldId}`
    : analysisTarget
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
        // Yjs path bootstraps via LexicalYjsPlugin — start empty
        if (yjsEnabled) {
          $getRoot().clear()
          return
        }
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
    // value intentionally omitted — ExternalHtmlSyncPlugin / Yjs own live updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace, yjsEnabled]
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
    if (tags?.has("collaboration")) return
    // Yjs plugin also emits HTML via onHtmlChange; skip duplicate here when bound
    if (yjsEnabled) return
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
        {/* Local undo only when not CRDT-bound (Yjs has its own history model). */}
        {!yjsEnabled && <HistoryPlugin />}
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <ExternalHtmlSyncPlugin html={value} disabled={yjsEnabled} />
        {yjsEnabled && yjsCtx.ydoc && fieldId && (
          <LexicalYjsPlugin
            ydoc={yjsCtx.ydoc}
            fieldId={fieldId}
            bootstrapHtml={value}
            userName={yjsCtx.userName}
            userColor={yjsCtx.userColor}
            onHtmlChange={onChange}
          />
        )}
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

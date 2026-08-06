import { useEffect, useId, useMemo } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { $generateHtmlFromNodes } from "@lexical/html"
import {
  $setSelection,
  type EditorState,
  type LexicalEditor,
} from "lexical"
import { cn } from "@mockmatch/ui/utils"
import { EXTERNAL_HTML_TAG } from "./constants"
import { isBlankHtml } from "./lib/blank-html"
import { $applyHtml } from "./lib/editor-html"
import { RICH_TEXT_NODES } from "./nodes"
import { HtmlSyncPlugin } from "./plugins/html-sync-plugin"
import { CollabCaretsPlugin } from "./plugins/collab-carets-plugin"
import { FloatingToolbar } from "./toolbar/floating-toolbar"
import { richTextTheme } from "./theme"
import type {
  RichTextCollabCarets,
  RichTextLabels,
  RichTextVariant,
} from "./types"

export type RichTextInputProps = {
  /** Controlled HTML (Lexical export). */
  readonly value: string
  readonly onChange?: (html: string) => void
  readonly labels: RichTextLabels
  readonly readOnly?: boolean
  readonly placeholder?: string
  readonly className?: string
  readonly ariaLabel?: string
  /**
   * `compact` — denser chrome, no heading panel (spreadsheet cells).
   * Prefer one live editor per active cell for sheet performance.
   */
  readonly variant?: RichTextVariant
  /** Optional collab caret overlay + local caret reporting (host transport). */
  readonly collab?: RichTextCollabCarets
  /** Stable namespace override (defaults to collab.fieldId or React id). */
  readonly namespace?: string
  /** Hide floating toolbar (programmatic format only). */
  readonly hideToolbar?: boolean
}

function BlurOnOutsidePointer() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const handler = (event: PointerEvent) => {
      const root = editor.getRootElement()
      if (!root || document.activeElement !== root) return
      const target = event.target as Node | null
      if (root.contains(target)) return
      if (
        target instanceof Element &&
        (target.closest("[data-rte-toolbar]") ||
          target.closest("[data-rich-text-toolbar]"))
      ) {
        return
      }
      root.blur()
      editor.update(() => $setSelection(null))
    }
    document.addEventListener("pointerdown", handler, true)
    return () => document.removeEventListener("pointerdown", handler, true)
  }, [editor])
  return null
}

function resolveNamespace(
  namespaceProp: string | undefined,
  fieldId: string | undefined,
  reactId: string
): string {
  if (namespaceProp) return namespaceProp
  if (fieldId) return `rt:${fieldId}`
  return `rt:${reactId}`
}

function ReadOnlyHtml({
  value,
  className,
}: {
  readonly value: string
  readonly className?: string
}) {
  if (isBlankHtml(value)) return null
  return (
    <div
      className={cn("whitespace-pre-wrap", className)}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}

function emitHtmlChange(
  editor: LexicalEditor,
  tags: Set<string> | undefined,
  onChange: (html: string) => void
): void {
  if (tags?.has(EXTERNAL_HTML_TAG) || tags?.has("collaboration")) return
  editor.read(() => onChange($generateHtmlFromNodes(editor, null)))
}

/**
 * Lightweight Lexical rich-text input for resume fields, cover letters,
 * spreadsheet cells, and other hosts that need shared formatting chrome.
 *
 * Host supplies labels + value/onChange (and optional collab transport).
 */
export function RichTextInput({
  value: valueProp,
  onChange,
  labels,
  readOnly,
  placeholder,
  className,
  ariaLabel,
  variant = "default",
  collab,
  namespace: namespaceProp,
  hideToolbar,
}: RichTextInputProps) {
  const value = valueProp ?? ""
  const reactId = useId()
  const namespace = resolveNamespace(namespaceProp, collab?.fieldId, reactId)
  const compact = variant === "compact"

  const initialConfig = useMemo(
    () => ({
      namespace,
      editable: !readOnly,
      theme: richTextTheme,
      nodes: RICH_TEXT_NODES,
      onError: (error: Error) => {
        throw error
      },
      editorState: (editor: LexicalEditor) => {
        // Runs inside Lexical's initial update — HtmlSyncPlugin owns later sync
        $applyHtml(editor, value)
      },
    }),
    // value intentionally omitted — HtmlSyncPlugin owns live external updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace, readOnly]
  )

  if (readOnly || !onChange) {
    return <ReadOnlyHtml value={value} className={className} />
  }

  const handleChange = (
    _editorState: EditorState,
    editor: LexicalEditor,
    tags?: Set<string>
  ) => {
    emitHtmlChange(editor, tags, onChange)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative" data-rich-text-input data-variant={variant}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              className={cn(
                "pan-ignore cursor-text whitespace-pre-wrap outline-none",
                compact && "min-h-[1.25em] text-sm leading-snug",
                className
              )}
            />
          }
          placeholder={
            placeholder ? (
              <div
                className={cn(
                  "pointer-events-none absolute left-0 top-0 select-none text-neutral-300 dark:text-neutral-600",
                  compact && "text-sm",
                  className
                )}
              >
                {placeholder}
              </div>
            ) : null
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin ignoreSelectionChange onChange={handleChange} />
        <HtmlSyncPlugin html={value} />
        {!hideToolbar && (
          <FloatingToolbar labels={labels} compact={compact} />
        )}
        {collab && <CollabCaretsPlugin collab={collab} />}
        <BlurOnOutsidePointer />
      </div>
    </LexicalComposer>
  )
}

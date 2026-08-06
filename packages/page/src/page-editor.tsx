import { useMemo } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import {
  DocumentYjsProvider,
  LexicalYjsPlugin,
} from "@mockmatch/document-editor"
import type { Doc } from "yjs"
import { cn } from "@mockmatch/ui/utils"
import { PAGE_EDITOR_NODES } from "./nodes"
import { HtmlSyncPlugin } from "./plugins/html-sync-plugin"
import { SlashMenuPlugin } from "./plugins/slash-menu-plugin"
import { ToolbarPlugin } from "./plugins/toolbar-plugin"
import { pageEditorTheme } from "./theme"
import type { PageEditorLabels } from "./types"

export type PageEditorProps = {
  readonly value: string
  readonly onChange?: (html: string) => void
  readonly labels: PageEditorLabels
  readonly readOnly?: boolean
  readonly className?: string
  readonly placeholder?: string
  /** Optional shared Y.Doc for collab (host owns room). */
  readonly ydoc?: Doc
  readonly collabFieldId?: string
  readonly collabUserName?: string
  readonly collabUserColor?: string
}

function PageEditorInner({
  value,
  onChange,
  labels,
  readOnly,
  placeholder,
  ydoc,
  collabFieldId,
  collabUserName,
  collabUserColor,
}: PageEditorProps) {
  const collab = Boolean(ydoc && collabFieldId)

  return (
    <>
      <ToolbarPlugin labels={labels} readOnly={readOnly} />
      {/* Playground-style scroller: muted desk + centered paper surface */}
      <div className="relative min-h-0 flex-1 overflow-y-auto bg-muted/40">
        <div className="mx-auto flex min-h-full w-full max-w-3xl justify-center px-3 py-6 sm:px-6 sm:py-8">
          <div
            className={cn(
              "relative w-full min-h-[min(70vh,40rem)] rounded-xl border border-border/80 bg-background",
              "px-6 py-8 shadow-sm sm:px-10 sm:py-10",
              "ring-1 ring-foreground/5"
            )}
            data-page-paper
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    "min-h-[min(50vh,28rem)] outline-none",
                    readOnly && "cursor-default"
                  )}
                  aria-placeholder={placeholder ?? labels.placeholder}
                  placeholder={
                    <div className="pointer-events-none absolute top-8 left-6 text-[15px] text-muted-foreground sm:top-10 sm:left-10">
                      {placeholder ?? labels.placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <CheckListPlugin />
      <LinkPlugin />
      <HorizontalRulePlugin />
      <SlashMenuPlugin labels={labels} readOnly={readOnly} />
      {collab && ydoc && collabFieldId ? (
        <LexicalYjsPlugin
          ydoc={ydoc}
          fieldId={collabFieldId}
          bootstrapHtml={value}
          userName={collabUserName}
          userColor={collabUserColor}
          onHtmlChange={onChange}
        />
      ) : (
        <HtmlSyncPlugin html={value} onChange={onChange} />
      )}
    </>
  )
}

/**
 * Freeform Lexical page editor (playground-style surface + MockMatch chrome).
 * Host owns HTML persistence and optional collab Y.Doc.
 */
export function PageEditor(props: PageEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: "MockMatchPage",
      theme: pageEditorTheme,
      nodes: PAGE_EDITOR_NODES,
      editable: !props.readOnly,
      onError(error: Error) {
        console.error("[@mockmatch/page]", error)
      },
    }),
    [props.readOnly]
  )

  const body = (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={cn(
          "flex h-full min-h-0 flex-col bg-background",
          props.className
        )}
      >
        <PageEditorInner {...props} />
      </div>
    </LexicalComposer>
  )

  if (props.ydoc) {
    return (
      <DocumentYjsProvider ydoc={props.ydoc} enabled>
        {body}
      </DocumentYjsProvider>
    )
  }

  return body
}

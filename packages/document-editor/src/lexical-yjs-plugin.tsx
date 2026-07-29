import { useEffect, useMemo, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  createBindingV2__EXPERIMENTAL,
  initLocalState,
  syncLexicalUpdateToYjsV2__EXPERIMENTAL,
  syncYjsChangesToLexicalV2__EXPERIMENTAL,
  syncYjsStateToLexicalV2__EXPERIMENTAL,
  type BindingV2,
} from "@lexical/yjs"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $getRoot,
  $insertNodes,
  $setSelection,
  COLLABORATION_TAG,
  HISTORIC_TAG,
  type LexicalEditor,
} from "lexical"
import * as Y from "yjs"
import type { Doc, Transaction, YEvent } from "yjs"
import { createLocalLexicalProvider } from "./lexical-yjs-provider"

function rootNameForField(fieldId: string): string {
  return `lx:${fieldId}`
}

function applyHtmlBootstrap(editor: LexicalEditor, html: string) {
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
    // Not COLLABORATION_TAG — must flow Lexical → Yjs to seed the fragment
    { discrete: true }
  )
}

/** Lexical 0.45+ needs active editor for $generateHtmlFromNodes (exportDOM). */
function emitHtml(editor: LexicalEditor, onHtmlChange?: (html: string) => void) {
  if (!onHtmlChange) return
  editor.read(() => {
    onHtmlChange($generateHtmlFromNodes(editor, null))
  })
}

interface LexicalYjsPluginProps {
  readonly ydoc: Doc
  /** Stable id (e.g. analysisTarget / block id). */
  readonly fieldId: string
  /** Seed empty Y fragment from current HTML once. */
  readonly bootstrapHtml?: string
  readonly userName?: string
  readonly userColor?: string
  /** Emit HTML when Lexical state changes (keeps React document in sync). */
  readonly onHtmlChange?: (html: string) => void
}

/**
 * Binds this Lexical editor to a unique XmlElement on the shared collab Y.Doc
 * via @lexical/yjs Binding V2. Host already syncs the Y.Doc over collab WS.
 */
export function LexicalYjsPlugin({
  ydoc,
  fieldId,
  bootstrapHtml = "",
  userName = "Editor",
  userColor = "#3B82F6",
  onHtmlChange,
}: LexicalYjsPluginProps) {
  const [editor] = useLexicalComposerContext()
  const provider = useMemo(() => createLocalLexicalProvider(), [])
  const bindingRef = useRef<BindingV2 | null>(null)
  const onHtmlChangeRef = useRef(onHtmlChange)
  onHtmlChangeRef.current = onHtmlChange
  const bootstrapRef = useRef(bootstrapHtml)
  // Capture initial HTML only (avoid re-bootstrap on every keystroke re-render)
  if (bootstrapRef.current === "" && bootstrapHtml) {
    bootstrapRef.current = bootstrapHtml
  }

  useEffect(() => {
    const docMap = new Map<string, Doc>([[fieldId, ydoc]])
    const rootName = rootNameForField(fieldId)
    const binding = createBindingV2__EXPERIMENTAL(editor, fieldId, ydoc, docMap, {
      rootName,
    })
    bindingRef.current = binding

    initLocalState(provider, userName, userColor, true, {})
    provider.connect()

    const rootType = binding.root

    const onYEvents = (
      events: Array<YEvent<Y.AbstractType<unknown>>>,
      transaction: Transaction
    ) => {
      // Skip echoes from our own Lexical→Yjs writes (origin = binding)
      if (transaction.origin === binding) return
      syncYjsChangesToLexicalV2__EXPERIMENTAL(
        binding,
        provider,
        // observeDeep is wider than the V2 helper's event type
        events as Parameters<
          typeof syncYjsChangesToLexicalV2__EXPERIMENTAL
        >[2],
        transaction,
        false
      )
      // After discrete collab update settles — use editor.read (not editorState.read)
      queueMicrotask(() => {
        emitHtml(editor, onHtmlChangeRef.current)
      })
    }

    rootType.observeDeep(onYEvents)

    const removeUpdateListener = editor.registerUpdateListener(
      ({
        prevEditorState,
        editorState,
        dirtyElements,
        normalizedNodes,
        tags,
      }) => {
        if (tags.has(COLLABORATION_TAG) || tags.has(HISTORIC_TAG)) {
          return
        }
        syncLexicalUpdateToYjsV2__EXPERIMENTAL(
          binding,
          provider,
          prevEditorState,
          editorState,
          dirtyElements,
          normalizedNodes,
          tags
        )
        emitHtml(editor, onHtmlChangeRef.current)
      }
    )

    // Initial: seed from HTML if Y fragment empty, else pull Y → Lexical
    const shared = ydoc.get(rootName, Y.XmlElement)
    const empty = shared.length === 0
    if (empty && bootstrapRef.current.trim()) {
      applyHtmlBootstrap(editor, bootstrapRef.current)
    } else {
      syncYjsStateToLexicalV2__EXPERIMENTAL(binding, provider)
    }

    return () => {
      rootType.unobserveDeep(onYEvents)
      removeUpdateListener()
      provider.disconnect()
      bindingRef.current = null
    }
    // bootstrapHtml intentionally not in deps — only initial seed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, ydoc, fieldId, provider, userName, userColor])

  return null
}

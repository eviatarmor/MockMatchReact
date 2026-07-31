// Side-effect: MonacoEnvironment.getWorker (must load with this module)
import "./monaco-environment"

import { useEffect, useRef, useState } from "react"
import * as monaco from "monaco-editor"
import { cn } from "@mockmatch/ui/utils"

import { MonacoRemotePointers } from "./collab/monaco-remote-pointers"
import type { MonacoEditorCollabProps } from "./collab/types"
import { useMonacoCollab } from "./collab/use-monaco-collab"
import { acquireMonacoModel, releaseMonacoModel } from "./monaco-models"
import type { IdeSettings } from "./types"
import {
  DEFAULT_FONT_FAMILY,
  LIGATURE_FONT_FAMILY,
} from "./types"

import "monaco-editor/min/vs/editor/editor.main.css"

export type MonacoEditorProps = {
  /**
   * Stable document id (usually the tab/file path). Editors with the same id
   * share one Monaco model — required for split panes and to avoid controlled
   * `value` races that yank the caret.
   */
  modelId: string
  /** Initial text only when the model is first created. Later host updates are ignored. */
  value?: string
  language?: string
  theme?: string
  settings: IdeSettings
  onChange?: (value: string | undefined) => void
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  className?: string
  /**
   * Optional multiplayer: presence (decorations + pointer) + Y.Text bind.
   * Host owns room/Y.Doc; pass peers + sendCursor from useCollabRoom.
   */
  collab?: MonacoEditorCollabProps | null
}

function buildEditorOptions(
  settings: IdeSettings,
  extra?: monaco.editor.IStandaloneEditorConstructionOptions
): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    automaticLayout: true,
    minimap: { enabled: settings.minimap },
    wordWrap: settings.wordWrap,
    lineNumbers: settings.lineNumbers,
    fontSize: settings.fontSize,
    tabSize: settings.tabSize,
    renderWhitespace: settings.renderWhitespace,
    fontLigatures: settings.ligatures,
    fontFamily:
      settings.fontFamily ??
      (settings.ligatures ? LIGATURE_FONT_FAMILY : DEFAULT_FONT_FAMILY),
    smoothScrolling: settings.smoothScrolling,
    bracketPairColorization: {
      enabled: settings.bracketPairColorization,
    },
    scrollBeyondLastLine: false,
    padding: { top: 8, bottom: 8 },
    contextmenu: true,
    ...extra,
  }
}

export function MonacoEditor({
  modelId,
  value = "",
  language = "plaintext",
  theme = "vs-dark",
  settings,
  onChange,
  options,
  className,
  collab,
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const onChangeRef = useRef(onChange)
  const modelIdRef = useRef(modelId)
  const collabPath = collab?.path ?? modelId
  const collabForHooks: MonacoEditorCollabProps | null = collab
    ? { ...collab, path: collabPath }
    : null

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Create editor + attach shared model once per mount.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const model = acquireMonacoModel(modelId, value, language)
    modelIdRef.current = modelId

    const editor = monaco.editor.create(el, {
      model,
      theme,
      ...buildEditorOptions(settings, {
        ...options,
        readOnly: collab?.readOnly ?? options?.readOnly,
      }),
    })
    editorRef.current = editor
    setEditorInstance(editor)

    const sub = model.onDidChangeContent(() => {
      // When Y-bound, host may still want change notifications
      onChangeRef.current?.(model.getValue())
    })

    return () => {
      sub.dispose()
      editor.setModel(null)
      editor.dispose()
      editorRef.current = null
      setEditorInstance(null)
      releaseMonacoModel(modelId)
    }
    // Mount once; modelId changes remount via React key from parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Language only — never rewrite buffer text from React props.
  useEffect(() => {
    const editor = editorRef.current
    const model = editor?.getModel()
    if (!model) return
    if (model.getLanguageId() === language) return
    monaco.editor.setModelLanguage(model, language)
  }, [language])

  useEffect(() => {
    monaco.editor.setTheme(theme)
  }, [theme])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions(
      buildEditorOptions(settings, {
        ...options,
        readOnly: collab?.readOnly ?? options?.readOnly,
      })
    )
  }, [settings, options, collab?.readOnly])

  const { surfaceSize, enabled: collabEnabled } = useMonacoCollab(
    editorInstance,
    collabForHooks
  )

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col",
        className
      )}
      data-slot="monaco-editor"
    >
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
      {collabEnabled && collabForHooks && (
        <MonacoRemotePointers
          peers={collabForHooks.peers}
          path={collabPath}
          selfUserId={collabForHooks.selfUserId}
          surfaceWidth={surfaceSize.w}
          surfaceHeight={surfaceSize.h}
        />
      )}
    </div>
  )
}

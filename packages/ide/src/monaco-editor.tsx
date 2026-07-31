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
    // Color picker language feature is expensive on open; host can re-enable via extra.
    colorDecorators: false,
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
    // Never use automaticLayout — it reflows on every parent size tick (tree/AI
    // width anim) and freezes shell animations. We layout via rAF ResizeObserver.
    // Forced after spread so hosts cannot re-enable by accident.
    automaticLayout: false,
  }
}

/**
 * Schedule work after paint. Prefer idle so shell springs/opacity can finish;
 * hard-timeout so the editor never stays blank for long.
 */
function afterPaint(run: () => void): () => void {
  let cancelled = false
  let idleId: number | undefined
  let timeoutId: number | undefined
  let raf2 = 0
  const raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(() => {
      if (cancelled) return
      const start = () => {
        if (!cancelled) run()
      }
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(start, { timeout: 64 })
      } else {
        timeoutId = window.setTimeout(start, 0)
      }
    })
  })
  return () => {
    cancelled = true
    cancelAnimationFrame(raf1)
    cancelAnimationFrame(raf2)
    if (idleId != null && typeof cancelIdleCallback === "function") {
      cancelIdleCallback(idleId)
    }
    if (timeoutId != null) window.clearTimeout(timeoutId)
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

  // Create editor after first paint so tree/panel transitions are not starved.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let disposed = false
    let editor: monaco.editor.IStandaloneCodeEditor | null = null
    let contentSub: monaco.IDisposable | null = null
    let ro: ResizeObserver | null = null
    let layoutTimer = 0
    let lastW = -1
    let lastH = -1

    /**
     * Trailing debounce (~panel CSS duration): during tree width transitions the
     * host resizes every frame; layout() only once size settles. Drag-resize
     * still feels live enough at ~8 updates/s after settle window.
     */
    const LAYOUT_DEBOUNCE_MS = 120

    const scheduleLayout = () => {
      if (layoutTimer) window.clearTimeout(layoutTimer)
      layoutTimer = window.setTimeout(() => {
        layoutTimer = 0
        editor?.layout()
      }, LAYOUT_DEBOUNCE_MS)
    }

    const cancelSchedule = afterPaint(() => {
      if (disposed || !containerRef.current) return
      const host = containerRef.current

      const model = acquireMonacoModel(modelId, value, language)
      modelIdRef.current = modelId

      editor = monaco.editor.create(host, {
        model,
        theme,
        ...buildEditorOptions(settings, {
          ...options,
          readOnly: collab?.readOnly ?? options?.readOnly,
        }),
      })
      editorRef.current = editor

      contentSub = model.onDidChangeContent(() => {
        onChangeRef.current?.(model.getValue())
      })

      ro = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry || !editor) return
        const { width, height } = entry.contentRect
        if (width <= 0 || height <= 0) return
        if (Math.abs(width - lastW) < 0.5 && Math.abs(height - lastH) < 0.5) {
          return
        }
        lastW = width
        lastH = height
        scheduleLayout()
      })
      ro.observe(host)
      editor.layout()
      setEditorInstance(editor)
    })

    return () => {
      disposed = true
      cancelSchedule()
      if (layoutTimer) window.clearTimeout(layoutTimer)
      ro?.disconnect()
      contentSub?.dispose()
      if (editor) {
        editor.setModel(null)
        editor.dispose()
      }
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

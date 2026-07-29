import { useEffect, useRef } from "react"
import * as monaco from "monaco-editor"
import { cn } from "@mockmatch/ui/utils"

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
}

type VimController = {
  dispose: () => void
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

async function attachVim(
  editor: monaco.editor.IStandaloneCodeEditor,
  statusEl: HTMLElement
): Promise<VimController> {
  const mod = await import("monaco-vim")
  const initVimMode = mod.initVimMode
  if (typeof initVimMode !== "function") {
    throw new Error("monaco-vim initVimMode not found")
  }
  return initVimMode(editor, statusEl) as VimController
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
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const vimRef = useRef<VimController | null>(null)
  const onChangeRef = useRef(onChange)
  const modelIdRef = useRef(modelId)

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
      ...buildEditorOptions(settings, options),
    })
    editorRef.current = editor

    const sub = model.onDidChangeContent(() => {
      onChangeRef.current?.(model.getValue())
    })

    return () => {
      vimRef.current?.dispose()
      vimRef.current = null
      sub.dispose()
      editor.setModel(null)
      editor.dispose()
      editorRef.current = null
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
    editor.updateOptions(buildEditorOptions(settings, options))
  }, [settings, options])

  useEffect(() => {
    const editor = editorRef.current
    const statusEl = statusRef.current
    if (!editor || !statusEl) return

    let cancelled = false
    const editorInstance = editor
    const statusNode = statusEl

    async function syncVim() {
      vimRef.current?.dispose()
      vimRef.current = null
      statusNode.textContent = ""

      if (settings.keybindings !== "vim") return

      try {
        const controller = await attachVim(editorInstance, statusNode)
        if (cancelled) {
          controller.dispose()
          return
        }
        vimRef.current = controller
      } catch {
        // Vim optional
      }
    }

    void syncVim()

    return () => {
      cancelled = true
      vimRef.current?.dispose()
      vimRef.current = null
    }
  }, [settings.keybindings])

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col", className)}
      data-slot="monaco-editor"
    >
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
      {settings.keybindings === "vim" ? (
        <div
          ref={statusRef}
          className="shrink-0 border-t border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
          data-slot="monaco-vim-status"
        />
      ) : (
        <div ref={statusRef} className="hidden" aria-hidden />
      )}
    </div>
  )
}

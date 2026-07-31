/**
 * Monaco language services must run in Web Workers. Without this factory,
 * monaco-editor falls back to the main thread and freezes the UI.
 *
 * Import once before `monaco.editor.create` (side-effect setup).
 * Vite `?worker` emits real module workers in both dev and prod.
 *
 * @see https://github.com/microsoft/monaco-editor#faq
 */

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker: (workerId: string, label: string) => Worker
    }
  }
}

let configured = false

export function ensureMonacoEnvironment(): void {
  if (configured || typeof window === "undefined") return
  configured = true

  window.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      switch (label) {
        case "json":
          return new jsonWorker()
        case "css":
        case "scss":
        case "less":
          return new cssWorker()
        case "html":
        case "handlebars":
        case "razor":
          return new htmlWorker()
        case "typescript":
        case "javascript":
          return new tsWorker()
        default:
          return new editorWorker()
      }
    },
  }
}

ensureMonacoEnvironment()

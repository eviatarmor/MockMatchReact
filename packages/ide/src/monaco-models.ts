import "./monaco-environment"
import * as monaco from "monaco-editor"

type ModelEntry = {
  model: monaco.editor.ITextModel
  refCount: number
}

const models = new Map<string, ModelEntry>()

function uriFor(id: string): monaco.Uri {
  return monaco.Uri.parse(`inmemory://mockmatch-ide/${encodeURIComponent(id)}`)
}

/**
 * Shared text models keyed by document id.
 * Multiple editor panes (split) attach to the same model → one buffer, no
 * React `value` prop races rewriting the model while typing.
 */
export function acquireMonacoModel(
  id: string,
  value: string,
  language: string
): monaco.editor.ITextModel {
  const existing = models.get(id)
  if (existing) {
    existing.refCount += 1
    if (existing.model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(existing.model, language)
    }
    return existing.model
  }

  const model = monaco.editor.createModel(value, language, uriFor(id))
  models.set(id, { model, refCount: 1 })
  return model
}

export function releaseMonacoModel(id: string): void {
  const entry = models.get(id)
  if (!entry) return
  entry.refCount -= 1
  if (entry.refCount > 0) return
  entry.model.dispose()
  models.delete(id)
}

/** Drop a model even if still referenced (tab closed / deleted). */
export function disposeMonacoModel(id: string): void {
  const entry = models.get(id)
  if (!entry) return
  entry.model.dispose()
  models.delete(id)
}

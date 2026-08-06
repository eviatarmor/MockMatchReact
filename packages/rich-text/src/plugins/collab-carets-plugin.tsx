import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical"
import { mergeRegister } from "@lexical/utils"
import { measureCaretInRoot } from "../lib/caret-geometry"
import type { RichTextCollabCarets } from "../types"
import { RemoteCaretsOverlay } from "../collab/remote-carets"

/**
 * Reports local caret geometry to the host and paints remote carets.
 *
 * Transport is intentionally **out of package**: host publishes
 * `onLocalCaretChange` over presence / Yjs awareness and feeds `peers` back.
 * See package README § Collaboration carets for the next integration step
 * (`@lexical/yjs` Awareness or `@mockmatch/collab` presence channel).
 */
export function CollabCaretsPlugin({
  collab,
}: {
  readonly collab: RichTextCollabCarets
}) {
  const [editor] = useLexicalComposerContext()
  const collabRef = useRef(collab)
  collabRef.current = collab

  useEffect(() => {
    const emit = () => {
      const { fieldId, onLocalCaretChange } = collabRef.current
      if (!onLocalCaretChange) return
      const root = editor.getRootElement()
      if (!root || document.activeElement !== root) {
        onLocalCaretChange(null)
        return
      }
      onLocalCaretChange(measureCaretInRoot(root, fieldId))
    }

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(emit)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          editor.getEditorState().read(emit)
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerRootListener((root, prev) => {
        const onBlur = () => collabRef.current.onLocalCaretChange?.(null)
        prev?.removeEventListener("blur", onBlur)
        root?.addEventListener("blur", onBlur)
      })
    )
  }, [editor])

  return <RemoteCaretsOverlay peers={collab.peers ?? []} />
}

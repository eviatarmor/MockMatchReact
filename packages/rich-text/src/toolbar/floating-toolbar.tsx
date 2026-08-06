import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { mergeRegister } from "@lexical/utils"
import { cn } from "@mockmatch/ui/utils"
import type { RichTextLabels } from "../types"
import {
  getSelectedLinkUrl,
  readActiveFormats,
  type ActiveFormats,
} from "../lib/formats"
import { measureToolbarAnchor } from "../lib/toolbar-selection"
import { FormatButtons } from "./format-buttons"
import { ToolbarPanels } from "./toolbar-panels"
import { LinkSlide } from "./link-slide"

const INITIAL: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  link: false,
  textColor: null,
  highlight: null,
  blockType: "paragraph",
}

type Panel = "none" | "color" | "highlight" | "heading" | "link"

/**
 * Floating format toolbar over a non-empty selection.
 * Portaled to body so it works inside zoom/pan canvases.
 */
export function FloatingToolbar({
  labels,
  compact,
}: {
  readonly labels: RichTextLabels
  readonly compact?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [active, setActive] = useState<ActiveFormats>(INITIAL)
  const [panel, setPanel] = useState<Panel>("none")
  const [linkUrl, setLinkUrl] = useState("")

  const update = useCallback(() => {
    const anchor = measureToolbarAnchor(editor)
    if (!anchor) {
      setPos(null)
      setPanel("none")
      return
    }
    setPos(anchor)
    const formats = readActiveFormats()
    if (formats) setActive(formats)
  }, [editor])

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) =>
          editorState.read(update)
        ),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            editor.getEditorState().read(update)
            return false
          },
          COMMAND_PRIORITY_LOW
        )
      ),
    [editor, update]
  )

  useEffect(() => {
    const onBlur = () => {
      setPos(null)
      setPanel("none")
    }
    return editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener("blur", onBlur)
      root?.addEventListener("blur", onBlur)
    })
  }, [editor])

  useEffect(() => {
    const reposition = () => editor.getEditorState().read(update)
    window.addEventListener("resize", reposition)
    window.addEventListener("scroll", reposition, true)
    return () => {
      window.removeEventListener("resize", reposition)
      window.removeEventListener("scroll", reposition, true)
    }
  }, [editor, update])

  if (!pos) return null

  const closePanel = () => setPanel("none")
  const togglePanel = (next: Panel) =>
    setPanel((p) => (p === next ? "none" : next))

  const openLink = () => {
    let current = ""
    editor.getEditorState().read(() => {
      current = getSelectedLinkUrl() ?? ""
    })
    setLinkUrl(current)
    setPanel("link")
  }

  return createPortal(
    <div
      data-rte-toolbar
      data-rich-text-toolbar
      className={cn(
        "pan-ignore fixed z-50 flex -translate-x-1/2 -translate-y-[calc(100%+8px)] flex-col gap-1",
        "rounded-lg border border-neutral-200 bg-white p-1 shadow-xl ring-1 ring-black/5",
        "dark:border-transparent dark:bg-neutral-900 dark:ring-black/30"
      )}
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="flex items-center gap-0.5">
        {panel === "link" ? (
          <LinkSlide
            open
            initialUrl={linkUrl}
            placeholder={labels.linkPlaceholder}
            applyLabel={labels.linkApply}
            removeLabel={labels.linkRemove}
            onApply={(url) => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
              closePanel()
            }}
            onRemove={
              labels.linkRemove
                ? () => {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                    closePanel()
                  }
                : undefined
            }
            onClose={closePanel}
          />
        ) : (
          <FormatButtons
            editor={editor}
            labels={labels}
            active={active}
            panel={panel}
            compact={compact}
            onTogglePanel={togglePanel}
            onOpenLink={openLink}
          />
        )}
      </div>
      <ToolbarPanels
        editor={editor}
        labels={labels}
        active={active}
        panel={panel}
        compact={compact}
        onClose={closePanel}
      />
    </div>,
    document.body
  )
}

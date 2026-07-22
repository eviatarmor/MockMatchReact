import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  type TextFormatType,
} from "lexical"
import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { mergeRegister } from "@lexical/utils"
import { Bold, Italic, Underline, List, Link, RemoveFormatting } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RichTextToolbarLabels {
  readonly bold: string
  readonly italic: string
  readonly underline: string
  readonly list: string
  readonly link: string
  readonly clear: string
  readonly linkPrompt: string
}

interface ToolbarButtonProps {
  readonly label: string
  readonly active?: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}

function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Keep the text selection while clicking the toolbar.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        "dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white",
        active && "bg-neutral-100 text-neutral-900 dark:bg-white/15 dark:text-white"
      )}
    >
      {children}
    </button>
  )
}

/**
 * Floating format toolbar that appears over a non-empty text selection inside a
 * Lexical editor. Portaled to the body and positioned in viewport coordinates,
 * so it sits correctly even inside a zoom/pan canvas.
 */
export function FloatingTextToolbar({ labels }: { readonly labels: RichTextToolbarLabels }) {
  const [editor] = useLexicalComposerContext()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [active, setActive] = useState({ bold: false, italic: false, underline: false })

  const update = useCallback(() => {
    const selection = $getSelection()
    const native = window.getSelection()
    const root = editor.getRootElement()
    if (
      !$isRangeSelection(selection) ||
      selection.isCollapsed() ||
      !native ||
      native.rangeCount === 0 ||
      !root ||
      document.activeElement !== root ||
      !root.contains(native.anchorNode)
    ) {
      setPos(null)
      return
    }
    const rect = native.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setPos(null)
      return
    }
    setPos({ top: rect.top, left: rect.left + rect.width / 2 })
    setActive({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
    })
  }, [editor])

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(update)),
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

  // Hide as soon as the editor loses focus (blur fires no editor update).
  useEffect(() => {
    const onBlur = () => setPos(null)
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

  const format = (type: TextFormatType) => editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)

  const clearFormatting = () =>
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const formats: TextFormatType[] = ["bold", "italic", "underline", "strikethrough"]
        formats.forEach((f) => {
          if (selection.hasFormat(f)) editor.dispatchCommand(FORMAT_TEXT_COMMAND, f)
        })
      }
    })

  const insertLink = () => {
    const url = window.prompt(labels.linkPrompt, "https://")
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
  }

  return createPortal(
    <div
      data-rte-toolbar
      className="pan-ignore fixed z-50 flex -translate-x-1/2 -translate-y-[calc(100%+8px)] items-center gap-0.5 rounded-lg border border-neutral-200 bg-white p-1 shadow-xl ring-1 ring-black/5 dark:border-transparent dark:bg-neutral-900 dark:ring-black/30"
      style={{ top: pos.top, left: pos.left }}
    >
      <ToolbarButton label={labels.bold} active={active.bold} onClick={() => format("bold")}>
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton label={labels.italic} active={active.italic} onClick={() => format("italic")}>
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton label={labels.underline} active={active.underline} onClick={() => format("underline")}>
        <Underline className="size-4" />
      </ToolbarButton>
      <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-white/15" />
      <ToolbarButton label={labels.list} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton label={labels.link} onClick={insertLink}>
        <Link className="size-4" />
      </ToolbarButton>
      <ToolbarButton label={labels.clear} onClick={clearFormatting}>
        <RemoveFormatting className="size-4" />
      </ToolbarButton>
    </div>,
    document.body
  )
}

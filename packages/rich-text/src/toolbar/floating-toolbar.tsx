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
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { mergeRegister } from "@lexical/utils"
import {
  Bold,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  RemoveFormatting,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react"
import { cn } from "@mockmatch/ui/utils"
import type { RichTextBlockType, RichTextLabels } from "../types"
import {
  applyBlockType,
  applyHighlight,
  applyTextColor,
  clearSelectionTextFormats,
  getSelectedLinkUrl,
  readActiveFormats,
  type ActiveFormats,
} from "../lib/formats"
import { ToolbarButton } from "./toolbar-button"
import { ColorSwatchMenu } from "./color-swatch-menu"
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
      setPanel("none")
      return
    }
    const rect = native.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setPos(null)
      return
    }
    setPos({ top: rect.top, left: rect.left + rect.width / 2 })
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

  const format = (type: TextFormatType) =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)

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

  const setBlock = (type: RichTextBlockType) => {
    applyBlockType(editor, type)
    setPanel("none")
  }

  const blockLabel = (() => {
    switch (active.blockType) {
      case "h1":
        return labels.heading1
      case "h2":
        return labels.heading2
      case "h3":
        return labels.heading3
      case "bullet":
        return labels.bulletList
      case "number":
        return labels.orderedList
      default:
        return labels.paragraph
    }
  })()

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
              setPanel("none")
            }}
            onRemove={
              labels.linkRemove
                ? () => {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                    setPanel("none")
                  }
                : undefined
            }
            onClose={() => setPanel("none")}
          />
        ) : (
          <>
            <ToolbarButton
              label={labels.bold}
              active={active.bold}
              onClick={() => format("bold")}
            >
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.italic}
              active={active.italic}
              onClick={() => format("italic")}
            >
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.underline}
              active={active.underline}
              onClick={() => format("underline")}
            >
              <Underline className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.strikethrough}
              active={active.strikethrough}
              onClick={() => format("strikethrough")}
            >
              <Strikethrough className="size-4" />
            </ToolbarButton>

            <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-white/15" />

            <ToolbarButton
              label={labels.textColor}
              active={panel === "color" || active.textColor != null}
              onClick={() => togglePanel("color")}
            >
              <Palette className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.highlight}
              active={panel === "highlight" || active.highlight != null}
              onClick={() => togglePanel("highlight")}
            >
              <Highlighter className="size-4" />
            </ToolbarButton>

            <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-white/15" />

            {!compact && (
              <ToolbarButton
                label={labels.heading}
                active={
                  panel === "heading" || active.blockType.startsWith("h")
                }
                onClick={() => togglePanel("heading")}
              >
                <Type className="size-4" />
              </ToolbarButton>
            )}
            <ToolbarButton
              label={labels.bulletList}
              active={active.blockType === "bullet"}
              onClick={() => setBlock("bullet")}
            >
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.orderedList}
              active={active.blockType === "number"}
              onClick={() => setBlock("number")}
            >
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.link}
              active={active.link}
              onClick={openLink}
            >
              <Link className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label={labels.clear}
              onClick={() =>
                editor.update(() => clearSelectionTextFormats())
              }
            >
              <RemoveFormatting className="size-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {panel === "color" && (
        <ColorSwatchMenu
          kind="text"
          noneLabel={labels.colorNone ?? "Default"}
          activeColor={active.textColor}
          onPick={(color) => {
            editor.update(() => applyTextColor(color))
            setPanel("none")
          }}
        />
      )}
      {panel === "highlight" && (
        <ColorSwatchMenu
          kind="highlight"
          noneLabel={labels.colorNone ?? "None"}
          activeColor={active.highlight}
          onPick={(color) => {
            editor.update(() => applyHighlight(color))
            setPanel("none")
          }}
        />
      )}
      {panel === "heading" && !compact && (
        <div
          className="flex flex-col gap-0.5 p-0.5"
          onMouseDown={(e) => e.preventDefault()}
        >
          {(
            [
              ["paragraph", labels.paragraph],
              ["h1", labels.heading1],
              ["h2", labels.heading2],
              ["h3", labels.heading3],
            ] as const
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                "hover:bg-neutral-100 dark:hover:bg-white/10",
                active.blockType === type &&
                  "bg-neutral-100 font-medium dark:bg-white/15"
              )}
              onClick={() => setBlock(type)}
            >
              {label}
            </button>
          ))}
          <p className="px-2 pt-0.5 text-[10px] text-neutral-400">
            {blockLabel}
          </p>
        </div>
      )}
    </div>,
    document.body
  )
}

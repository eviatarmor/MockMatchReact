import { useCallback, useEffect, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  type TextFormatType,
} from "lexical"
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list"
import { $setBlocksType } from "@lexical/selection"
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text"
import { $createParagraphNode } from "lexical"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { mergeRegister } from "@lexical/utils"
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Strikethrough,
  Type,
  Underline,
} from "lucide-react"
import { cn } from "@mockmatch/ui/utils"
import type { PageEditorLabels } from "../types"

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  readonly label: string
  readonly active?: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        "text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
}

export function ToolbarPlugin({
  labels,
  readOnly,
}: {
  readonly labels: PageEditorLabels
  readonly readOnly?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  })

  const update = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setActive({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
      strikethrough: selection.hasFormat("strikethrough"),
    })
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(update)
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, update])

  const formatText = (fmt: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt)
  }

  const setHeading = (tag: HeadingTagType | "paragraph" | "quote") => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (tag === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode())
      } else if (tag === "quote") {
        $setBlocksType(selection, () => $createQuoteNode())
      } else {
        $setBlocksType(selection, () => $createHeadingNode(tag))
      }
    })
  }

  if (readOnly) return null

  return (
    <div
      className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border/60 bg-neutral-50/75 px-2 py-1.5 backdrop-blur-md dark:bg-neutral-950/75"
      data-page-toolbar
    >
      <ToolbarButton
        label={labels.bold}
        active={active.bold}
        onClick={() => formatText("bold")}
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.italic}
        active={active.italic}
        onClick={() => formatText("italic")}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.underline}
        active={active.underline}
        onClick={() => formatText("underline")}
      >
        <Underline className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.strikethrough}
        active={active.strikethrough}
        onClick={() => formatText("strikethrough")}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        label={labels.paragraph}
        onClick={() => setHeading("paragraph")}
      >
        <Type className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label={labels.heading1} onClick={() => setHeading("h1")}>
        <Heading1 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label={labels.heading2} onClick={() => setHeading("h2")}>
        <Heading2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label={labels.heading3} onClick={() => setHeading("h3")}>
        <Heading3 className="size-3.5" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        label={labels.bulletList}
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.numberedList}
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.checkList}
        onClick={() =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
        }
      >
        <ListTodo className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label={labels.quote} onClick={() => setHeading("quote")}>
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.code}
        onClick={() => {
          editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) return
            // Toggle inline code format
            selection.formatText("code")
          })
        }}
      >
        <Code2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.divider}
        onClick={() =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }
      >
        <Minus className="size-3.5" />
      </ToolbarButton>
      <Separator />
      <ToolbarButton
        label={labels.link}
        onClick={() => {
          const url = window.prompt(labels.linkPrompt, "https://")
          if (url === null) return
          if (url === "") {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          }
        }}
      >
        <Link className="size-3.5" />
      </ToolbarButton>
    </div>
  )
}

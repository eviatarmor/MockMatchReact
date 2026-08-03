import { useCallback, useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode,
} from "lexical"
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { $setBlocksType } from "@lexical/selection"
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import { $createCodeNode } from "@lexical/code"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { cn } from "@mockmatch/ui/utils"
import type { PageEditorLabels, SlashItem, SlashItemId } from "../types"

function buildItems(labels: PageEditorLabels): SlashItem[] {
  return [
    {
      id: "paragraph",
      label: labels.paragraph,
      keywords: ["text", "p", "paragraph"],
    },
    { id: "h1", label: labels.heading1, keywords: ["h1", "heading", "title"] },
    { id: "h2", label: labels.heading2, keywords: ["h2", "heading"] },
    { id: "h3", label: labels.heading3, keywords: ["h3", "heading"] },
    {
      id: "bullet",
      label: labels.bulletList,
      keywords: ["ul", "bullet", "list"],
    },
    {
      id: "number",
      label: labels.numberedList,
      keywords: ["ol", "number", "list"],
    },
    {
      id: "check",
      label: labels.checkList,
      keywords: ["todo", "check", "task"],
    },
    { id: "quote", label: labels.quote, keywords: ["quote", "blockquote"] },
    { id: "code", label: labels.code, keywords: ["code", "pre"] },
    {
      id: "divider",
      label: labels.divider,
      keywords: ["hr", "divider", "line"],
    },
  ]
}

function applySlash(editor: ReturnType<typeof useLexicalComposerContext>[0], id: SlashItemId) {
  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    // Remove the `/query` text that triggered the menu
    const anchor = selection.anchor
    const node = anchor.getNode()
    if (node instanceof TextNode) {
      const text = node.getTextContent()
      const offset = anchor.offset
      const before = text.slice(0, offset)
      const slashIdx = before.lastIndexOf("/")
      if (slashIdx >= 0) {
        node.spliceText(slashIdx, offset - slashIdx, "")
        // Re-get selection after mutation
      }
    }
  })

  editor.update(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    switch (id) {
      case "paragraph":
        $setBlocksType(selection, () => $createParagraphNode())
        break
      case "h1":
      case "h2":
      case "h3":
        $setBlocksType(selection, () =>
          $createHeadingNode(id as HeadingTagType)
        )
        break
      case "quote":
        $setBlocksType(selection, () => $createQuoteNode())
        break
      case "code":
        $setBlocksType(selection, () => $createCodeNode())
        break
      case "bullet":
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        break
      case "number":
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        break
      case "check":
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
        break
      case "divider":
        editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        break
    }
  })
}

export function SlashMenuPlugin({
  labels,
  readOnly,
}: {
  readonly labels: PageEditorLabels
  readonly readOnly?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(0)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const items = useMemo(() => buildItems(labels), [labels])
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.keywords.some((k) => k.includes(q))
    )
  }, [items, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setIndex(0)
  }, [])

  const pick = useCallback(
    (id: SlashItemId) => {
      applySlash(editor, id)
      close()
    },
    [close, editor]
  )

  useEffect(() => {
    if (readOnly) return
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          close()
          return
        }
        const anchor = selection.anchor
        const node = anchor.getNode()
        if (!(node instanceof TextNode)) {
          close()
          return
        }
        const text = node.getTextContent().slice(0, anchor.offset)
        const match = /(?:^|\s)\/([^\s/]*)$/.exec(text)
        if (!match) {
          close()
          return
        }
        setQuery(match[1] ?? "")
        setOpen(true)
        setIndex(0)
        const domSel = window.getSelection()
        if (domSel && domSel.rangeCount > 0) {
          const rect = domSel.getRangeAt(0).getBoundingClientRect()
          setPos({ top: rect.bottom + 6, left: rect.left })
        }
      })
    })
  }, [close, editor, readOnly])

  useEffect(() => {
    if (!open) return
    const onDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (e) => {
        e?.preventDefault()
        setIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)))
        return true
      },
      COMMAND_PRIORITY_HIGH
    )
    const onUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (e) => {
        e?.preventDefault()
        setIndex((i) => Math.max(i - 1, 0))
        return true
      },
      COMMAND_PRIORITY_HIGH
    )
    const onEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (e) => {
        const item = filtered[index]
        if (!item) return false
        e?.preventDefault()
        pick(item.id)
        return true
      },
      COMMAND_PRIORITY_HIGH
    )
    const onEsc = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        close()
        return true
      },
      COMMAND_PRIORITY_HIGH
    )
    return () => {
      onDown()
      onUp()
      onEnter()
      onEsc()
    }
  }, [close, editor, filtered, index, open, pick])

  if (!open || !pos || filtered.length === 0) return null

  return (
    <div
      role="listbox"
      aria-label={labels.slashMenuAria}
      className="fixed z-50 max-h-64 w-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
      style={{ top: pos.top, left: pos.left }}
    >
      {filtered.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={i === index}
          className={cn(
            "flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-left text-sm",
            i === index
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => pick(item.id)}
          onMouseEnter={() => setIndex(i)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

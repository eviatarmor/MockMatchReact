import { useCallback, useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  type ElementFormatType,
  type TextFormatType,
} from "lexical"
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  ListNode,
} from "@lexical/list"
import { $setBlocksType } from "@lexical/selection"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { $findMatchingParent, mergeRegister } from "@lexical/utils"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Italic,
  Link,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import { Separator } from "@mockmatch/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import type { BlockType, PageEditorLabels } from "../types"
import { LinkDialog } from "./link-dialog"

function ToolbarIconButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  readonly label: string
  readonly active?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "size-8 shrink-0 cursor-pointer text-muted-foreground",
              active && "bg-muted text-foreground"
            )}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

function getSelectedBlockType(): BlockType {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return "paragraph"

  const anchor = selection.anchor.getNode()
  let element =
    anchor.getKey() === "root"
      ? anchor
      : $findMatchingParent(anchor, (n) => {
          const parent = n.getParent()
          return parent !== null && parent.getKey() === "root"
        })

  if (element === null) {
    element = anchor.getTopLevelElementOrThrow()
  }

  if ($isHeadingNode(element)) {
    const tag = element.getTag()
    if (tag === "h1" || tag === "h2" || tag === "h3") return tag
  }
  if ($isQuoteNode(element)) return "quote"
  if ($isCodeNode(element)) return "code"
  if ($isListNode(element)) {
    const list = element as ListNode
    const listType = list.getListType()
    if (listType === "number") return "number"
    if (listType === "check") return "check"
    return "bullet"
  }

  const listParent = $findMatchingParent(anchor, $isListNode)
  if (listParent && $isListNode(listParent)) {
    const listType = listParent.getListType()
    if (listType === "number") return "number"
    if (listType === "check") return "check"
    return "bullet"
  }

  return "paragraph"
}

function getSelectedLinkUrl(): string | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  const node = selection.anchor.getNode()
  const parent = node.getParent()
  if ($isLinkNode(parent)) return parent.getURL()
  if ($isLinkNode(node)) return node.getURL()
  return null
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
    code: false,
    link: false,
  })
  const [blockType, setBlockType] = useState<BlockType>("paragraph")
  const [elementFormat, setElementFormat] =
    useState<ElementFormatType>("left")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const blockItems = useMemo(
    () => [
      { value: "paragraph", label: labels.paragraph },
      { value: "h1", label: labels.heading1 },
      { value: "h2", label: labels.heading2 },
      { value: "h3", label: labels.heading3 },
      { value: "bullet", label: labels.bulletList },
      { value: "number", label: labels.numberedList },
      { value: "check", label: labels.checkList },
      { value: "quote", label: labels.quote },
      { value: "code", label: labels.code },
    ],
    [labels]
  )

  const update = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return
    setActive({
      bold: selection.hasFormat("bold"),
      italic: selection.hasFormat("italic"),
      underline: selection.hasFormat("underline"),
      strikethrough: selection.hasFormat("strikethrough"),
      code: selection.hasFormat("code"),
      link: getSelectedLinkUrl() !== null,
    })
    setBlockType(getSelectedBlockType())
    const anchor = selection.anchor.getNode()
    const element = $isElementNode(anchor)
      ? anchor
      : $findMatchingParent(anchor, $isElementNode)
    setElementFormat(
      $isElementNode(element) ? element.getFormatType() || "left" : "left"
    )
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
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, update])

  const formatText = (fmt: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, fmt)
  }

  const formatAlign = (align: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align)
  }

  const applyBlockType = (type: BlockType) => {
    if (type === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      return
    }
    if (type === "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      return
    }
    if (type === "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      return
    }

    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode())
      } else if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode())
      } else if (type === "code") {
        $setBlocksType(selection, () => $createCodeNode())
      } else {
        $setBlocksType(selection, () =>
          $createHeadingNode(type as HeadingTagType)
        )
      }
    })
  }

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      const formats: TextFormatType[] = [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "code",
      ]
      for (const f of formats) {
        if (selection.hasFormat(f)) {
          selection.toggleFormat(f)
        }
      }
    })
  }

  const openLinkDialog = () => {
    editor.getEditorState().read(() => {
      setLinkUrl(getSelectedLinkUrl() ?? "https://")
    })
    setLinkOpen(true)
  }

  if (readOnly) return null

  const undoLabel = labels.undo ?? "Undo"
  const redoLabel = labels.redo ?? "Redo"
  const alignLeft = labels.alignLeft ?? "Align left"
  const alignCenter = labels.alignCenter ?? "Align center"
  const alignRight = labels.alignRight ?? "Align right"
  const alignJustify = labels.alignJustify ?? "Justify"
  const clearLabel = labels.clearFormatting ?? "Clear formatting"
  const blockTypeLabel = labels.blockType ?? "Block type"

  return (
    <>
      <TooltipProvider delay={300}>
        <div
          className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border/60 bg-background/90 px-2 py-1.5 backdrop-blur-md supports-backdrop-filter:bg-background/75"
          data-page-toolbar
          role="toolbar"
          aria-label={blockTypeLabel}
        >
          <ToolbarIconButton
            label={undoLabel}
            disabled={!canUndo}
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          >
            <Undo2 className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={redoLabel}
            disabled={!canRedo}
            onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          >
            <Redo2 className="size-3.5" />
          </ToolbarIconButton>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Select
            value={blockType}
            onValueChange={(v) => {
              if (v) applyBlockType(v as BlockType)
            }}
            items={blockItems}
          >
            <SelectTrigger
              size="sm"
              className="h-8 min-w-[8.5rem] cursor-pointer gap-1.5 border-border/80 bg-background text-xs"
              aria-label={blockTypeLabel}
              onMouseDown={(e) => e.preventDefault()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {blockItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolbarIconButton
            label={labels.bold}
            active={active.bold}
            onClick={() => formatText("bold")}
          >
            <Bold className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.italic}
            active={active.italic}
            onClick={() => formatText("italic")}
          >
            <Italic className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.underline}
            active={active.underline}
            onClick={() => formatText("underline")}
          >
            <Underline className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.strikethrough}
            active={active.strikethrough}
            onClick={() => formatText("strikethrough")}
          >
            <Strikethrough className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.code}
            active={active.code}
            onClick={() => formatText("code")}
          >
            <Code2 className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.link}
            active={active.link}
            onClick={openLinkDialog}
          >
            <Link className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={clearLabel}
            onClick={clearFormatting}
          >
            <RemoveFormatting className="size-3.5" />
          </ToolbarIconButton>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolbarIconButton
            label={labels.bulletList}
            active={blockType === "bullet"}
            onClick={() =>
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            }
          >
            <List className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.numberedList}
            active={blockType === "number"}
            onClick={() =>
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            }
          >
            <ListOrdered className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.checkList}
            active={blockType === "check"}
            onClick={() =>
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            }
          >
            <ListTodo className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.quote}
            active={blockType === "quote"}
            onClick={() => applyBlockType("quote")}
          >
            <Quote className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.divider}
            onClick={() =>
              editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
            }
          >
            <Minus className="size-3.5" />
          </ToolbarIconButton>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolbarIconButton
            label={alignLeft}
            active={elementFormat === "left" || elementFormat === ""}
            onClick={() => formatAlign("left")}
          >
            <AlignLeft className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={alignCenter}
            active={elementFormat === "center"}
            onClick={() => formatAlign("center")}
          >
            <AlignCenter className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={alignRight}
            active={elementFormat === "right"}
            onClick={() => formatAlign("right")}
          >
            <AlignRight className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={alignJustify}
            active={elementFormat === "justify"}
            onClick={() => formatAlign("justify")}
          >
            <AlignJustify className="size-3.5" />
          </ToolbarIconButton>
        </div>
      </TooltipProvider>

      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialUrl={linkUrl}
        labels={labels}
        onApply={(url) => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          setLinkOpen(false)
        }}
        onRemove={() => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        }}
      />
    </>
  )
}

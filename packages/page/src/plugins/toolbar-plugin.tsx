import { useCallback, useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
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
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list"
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { mergeRegister } from "@lexical/utils"
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
import {
  alignActiveFlags,
  buildBlockItems,
  listActiveFlags,
  resolveToolbarChromeLabels,
} from "./toolbar-labels"
import {
  applyNonListBlockType,
  clearSelectionTextFormats,
  dispatchListBlockCommand,
  getSelectedLinkUrl,
  isListBlockType,
  readToolbarSelectionSnapshot,
  type ToolbarActiveFormats,
} from "./toolbar-update-helpers"

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

const INITIAL_ACTIVE: ToolbarActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  link: false,
}

export function ToolbarPlugin({
  labels,
  readOnly,
}: {
  readonly labels: PageEditorLabels
  readonly readOnly?: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [active, setActive] = useState(INITIAL_ACTIVE)
  const [blockType, setBlockType] = useState<BlockType>("paragraph")
  const [elementFormat, setElementFormat] =
    useState<ElementFormatType>("left")
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const blockItems = useMemo(() => buildBlockItems(labels), [labels])
  const chrome = useMemo(() => resolveToolbarChromeLabels(labels), [labels])
  const listFlags = listActiveFlags(blockType)
  const alignFlags = alignActiveFlags(elementFormat)

  const update = useCallback(() => {
    const snap = readToolbarSelectionSnapshot()
    if (!snap) return
    setActive(snap.active)
    setBlockType(snap.blockType)
    setElementFormat(snap.elementFormat)
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
    if (isListBlockType(type)) {
      dispatchListBlockCommand(editor, type)
      return
    }
    editor.update(() => {
      applyNonListBlockType(type)
    })
  }

  const clearFormatting = () => {
    editor.update(() => {
      clearSelectionTextFormats()
    })
  }

  const openLinkDialog = () => {
    editor.getEditorState().read(() => {
      setLinkUrl(getSelectedLinkUrl() ?? "https://")
    })
    setLinkOpen(true)
  }

  if (readOnly) return null

  return (
    <>
      <TooltipProvider delay={300}>
        <div
          className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-0.5 border-b border-border/60 bg-background/90 px-2 py-1.5 backdrop-blur-md supports-backdrop-filter:bg-background/75"
          data-page-toolbar
          role="toolbar"
          aria-label={chrome.blockType}
        >
          <ToolbarIconButton
            label={chrome.undo}
            disabled={!canUndo}
            onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          >
            <Undo2 className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={chrome.redo}
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
              aria-label={chrome.blockType}
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
            label={chrome.clearFormatting}
            onClick={clearFormatting}
          >
            <RemoveFormatting className="size-3.5" />
          </ToolbarIconButton>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <ToolbarIconButton
            label={labels.bulletList}
            active={listFlags.bullet}
            onClick={() =>
              editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
            }
          >
            <List className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.numberedList}
            active={listFlags.number}
            onClick={() =>
              editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
            }
          >
            <ListOrdered className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.checkList}
            active={listFlags.check}
            onClick={() =>
              editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
            }
          >
            <ListTodo className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={labels.quote}
            active={listFlags.quote}
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
            label={chrome.alignLeft}
            active={alignFlags.left}
            onClick={() => formatAlign("left")}
          >
            <AlignLeft className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={chrome.alignCenter}
            active={alignFlags.center}
            onClick={() => formatAlign("center")}
          >
            <AlignCenter className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={chrome.alignRight}
            active={alignFlags.right}
            onClick={() => formatAlign("right")}
          >
            <AlignRight className="size-3.5" />
          </ToolbarIconButton>
          <ToolbarIconButton
            label={chrome.alignJustify}
            active={alignFlags.justify}
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

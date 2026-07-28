import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import {
  Copy,
  ClipboardPaste,
  FilePlus2,
  FolderPlus,
  Pencil,
  Scissors,
  TerminalSquare,
  Trash2,
} from "lucide-react"
import {
  TreeExpander,
  TreeIcon,
  TreeLabel,
  TreeNode,
  TreeNodeContent,
  TreeNodeTrigger,
  TreeProvider,
  TreeView,
} from "@mockmatch/ui/kibo-ui/tree"
import { Button } from "@mockmatch/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@mockmatch/ui/context-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"

import type {
  FileTreeCreateKind,
  FileTreeCreateRequest,
  IdeLabels,
  IdeTreeNode,
} from "./types"

export type { FileTreeCreateKind, FileTreeCreateRequest }

export type FileTreeProps = {
  tree: IdeTreeNode[]
  selectedId?: string
  onSelectionChange?: (selectedIds: string[]) => void
  defaultExpandedIds?: string[]
  showLines?: boolean
  className?: string
  onFilePreview?: (nodeId: string) => void
  onFileOpen?: (nodeId: string) => void
  onCreateFile?: (parentId: string | null, name: string) => boolean | void
  onCreateFolder?: (parentId: string | null, name: string) => boolean | void
  onDelete?: (nodeId: string) => void
  onRename?: (nodeId: string, name: string) => boolean | void
  onCopy?: (nodeId: string) => void
  onCut?: (nodeId: string) => void
  onPaste?: (parentId: string | null) => void
  onDuplicate?: (nodeId: string) => void
  /** Open folder path in terminal (folders only). */
  onOpenInTerminal?: (nodeId: string) => void
  canPaste?: boolean
  createRequest?: FileTreeCreateRequest | null
  labels?: IdeLabels
}

/** Folders first (Array.isArray(children)), then files; alpha within group. */
function sortTreeNodes(nodes: IdeTreeNode[]): IdeTreeNode[] {
  return [...nodes].sort((a, b) => {
    const aFolder = Array.isArray(a.children)
    const bFolder = Array.isArray(b.children)
    if (aFolder !== bFolder) return aFolder ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })
}

type DraftState =
  | { type: "create"; kind: FileTreeCreateKind; parentId: string | null }
  | { type: "rename"; nodeId: string; name: string; depth: number }

function parentIdForCreate(node: IdeTreeNode): string | null {
  if (Array.isArray(node.children)) return node.id
  const slash = node.id.lastIndexOf("/")
  if (slash <= 0) return null
  return node.id.slice(0, slash)
}

function NameInput({
  defaultName,
  depth,
  icon,
  ariaLabel,
  onCommit,
  onCancel,
}: {
  defaultName: string
  depth: number
  icon?: React.ReactNode
  ariaLabel: string
  onCommit: (name: string) => boolean | void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultName)
  const done = useRef(false)

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    const dot = defaultName.lastIndexOf(".")
    if (dot > 0) el.setSelectionRange(0, dot)
    else el.select()
  }, [defaultName])

  const commit = () => {
    if (done.current) return
    const next = value.trim()
    if (!next) {
      done.current = true
      onCancel()
      return
    }
    const ok = onCommit(next)
    if (ok === false) {
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }
    done.current = true
  }

  const cancel = () => {
    if (done.current) return
    done.current = true
    onCancel()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      commit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      cancel()
    }
  }

  return (
    <div
      className="mx-1 flex items-center gap-1 rounded-md px-2 py-1"
      style={{ paddingLeft: depth * 20 + 8 }}
      data-slot="ide-tree-draft"
    >
      {icon ? (
        <span className="mr-1 flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        aria-label={ariaLabel}
        className={cn(
          "h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-1.5 text-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      />
    </div>
  )
}

function TreeBranch({
  nodes,
  level,
  parentPath,
  draft,
  onStartCreate,
  onStartRename,
  onCommitCreate,
  onCommitRename,
  onCancelDraft,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onOpenInTerminal,
  canPaste,
  onFilePreview,
  onFileOpen,
  schedulePreview,
  cancelPreviewSchedule,
  labels,
}: {
  nodes: IdeTreeNode[]
  level: number
  parentPath: boolean[]
  draft: DraftState | null
  onStartCreate: (kind: FileTreeCreateKind, parentId: string | null) => void
  onStartRename: (node: IdeTreeNode, depth: number) => void
  onCommitCreate: (name: string) => boolean | void
  onCommitRename: (name: string) => boolean | void
  onCancelDraft: () => void
  onDelete?: (nodeId: string) => void
  onCopy?: (nodeId: string) => void
  onCut?: (nodeId: string) => void
  onPaste?: (parentId: string | null) => void
  onDuplicate?: (nodeId: string) => void
  onOpenInTerminal?: (nodeId: string) => void
  canPaste?: boolean
  onFilePreview?: (nodeId: string) => void
  onFileOpen?: (nodeId: string) => void
  schedulePreview: (nodeId: string) => void
  cancelPreviewSchedule: () => void
  labels?: IdeLabels
}) {
  const ordered = sortTreeNodes(nodes)
  return (
    <>
      {ordered.map((node, index) => {
        const isFolder = Array.isArray(node.children)
        const hasChildren = isFolder
        const isFile = !isFolder
        const isLast = index === ordered.length - 1
        const createParent = parentIdForCreate(node)
        const pasteTarget = hasChildren ? node.id : createParent

        const draftAfterNode =
          draft?.type === "create" && draft.parentId === node.id ? (
            <NameInput
              defaultName={draft.kind === "folder" ? "folder" : "untitled.ts"}
              depth={level + 1}
              icon={
                draft.kind === "folder" ? (
                  <FolderPlus className="size-3.5" />
                ) : (
                  <FilePlus2 className="size-3.5" />
                )
              }
              ariaLabel={
                draft.kind === "folder"
                  ? (labels?.newFolder ?? "New folder name")
                  : (labels?.newFile ?? "New file name")
              }
              onCommit={onCommitCreate}
              onCancel={onCancelDraft}
            />
          ) : null

        const isRenaming =
          draft?.type === "rename" && draft.nodeId === node.id

        const body = (
          <TreeNode
            nodeId={node.id}
            level={level}
            isLast={isLast && !draftAfterNode}
            parentPath={parentPath}
          >
            {isRenaming ? (
              <NameInput
                defaultName={draft.name}
                depth={level}
                ariaLabel={labels?.rename ?? "Rename"}
                onCommit={onCommitRename}
                onCancel={onCancelDraft}
              />
            ) : (
              <TreeNodeTrigger
                onClick={() => {
                  if (isFile && (onFilePreview || onFileOpen)) {
                    schedulePreview(node.id)
                  }
                }}
                onDoubleClick={(e) => {
                  if (!isFile) return
                  e.preventDefault()
                  e.stopPropagation()
                  cancelPreviewSchedule()
                  onFileOpen?.(node.id)
                }}
              >
                <TreeExpander hasChildren={hasChildren} />
                <TreeIcon hasChildren={hasChildren} />
                <TreeLabel>{node.name}</TreeLabel>
              </TreeNodeTrigger>
            )}
            {hasChildren ? (
              <TreeNodeContent hasChildren>
                <TreeBranch
                  nodes={node.children ?? []}
                  level={level + 1}
                  parentPath={[
                    ...parentPath,
                    ...(level > 0 ? [isLast] : []),
                  ]}
                  draft={
                    draft?.type === "create" && draft.parentId === node.id
                      ? null
                      : draft
                  }
                  onStartCreate={onStartCreate}
                  onStartRename={onStartRename}
                  onCommitCreate={onCommitCreate}
                  onCommitRename={onCommitRename}
                  onCancelDraft={onCancelDraft}
                  onDelete={onDelete}
                  onCopy={onCopy}
                  onCut={onCut}
                  onPaste={onPaste}
                  onDuplicate={onDuplicate}
                  onOpenInTerminal={onOpenInTerminal}
                  canPaste={canPaste}
                  onFilePreview={onFilePreview}
                  onFileOpen={onFileOpen}
                  schedulePreview={schedulePreview}
                  cancelPreviewSchedule={cancelPreviewSchedule}
                  labels={labels}
                />
              </TreeNodeContent>
            ) : null}
          </TreeNode>
        )

        return (
          <div key={node.id}>
            <ContextMenu>
              <ContextMenuTrigger className="block w-full">
                {body}
              </ContextMenuTrigger>
              <ContextMenuContent className="min-w-44">
                <ContextMenuItem
                  onClick={() => onStartCreate("file", createParent)}
                >
                  <FilePlus2 className="size-4" />
                  {labels?.newFile ?? "New File"}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => onStartCreate("folder", createParent)}
                >
                  <FolderPlus className="size-4" />
                  {labels?.newFolder ?? "New Folder"}
                </ContextMenuItem>
                <ContextMenuSeparator />
                {onCut ? (
                  <ContextMenuItem onClick={() => onCut(node.id)}>
                    <Scissors className="size-4" />
                    {labels?.cut ?? "Cut"}
                  </ContextMenuItem>
                ) : null}
                {onCopy ? (
                  <ContextMenuItem onClick={() => onCopy(node.id)}>
                    <Copy className="size-4" />
                    {labels?.copy ?? "Copy"}
                  </ContextMenuItem>
                ) : null}
                {onPaste ? (
                  <ContextMenuItem
                    disabled={!canPaste}
                    onClick={() => onPaste(pasteTarget)}
                  >
                    <ClipboardPaste className="size-4" />
                    {labels?.paste ?? "Paste"}
                  </ContextMenuItem>
                ) : null}
                {onDuplicate ? (
                  <ContextMenuItem onClick={() => onDuplicate(node.id)}>
                    <Copy className="size-4" />
                    {labels?.duplicate ?? "Duplicate"}
                  </ContextMenuItem>
                ) : null}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => onStartRename(node, level)}
                >
                  <Pencil className="size-4" />
                  {labels?.rename ?? "Rename"}
                </ContextMenuItem>
                {hasChildren && onOpenInTerminal ? (
                  <ContextMenuItem onClick={() => onOpenInTerminal(node.id)}>
                    <TerminalSquare className="size-4" />
                    {labels?.openInTerminal ?? "Open in Terminal"}
                  </ContextMenuItem>
                ) : null}
                {onDelete ? (
                  <ContextMenuItem
                    variant="destructive"
                    onClick={() => onDelete(node.id)}
                  >
                    <Trash2 className="size-4" />
                    {labels?.delete ?? "Delete"}
                  </ContextMenuItem>
                ) : null}
              </ContextMenuContent>
            </ContextMenu>
            {draftAfterNode}
          </div>
        )
      })}

      {level === 0 &&
      draft?.type === "create" &&
      draft.parentId == null ? (
        <NameInput
          defaultName={draft.kind === "folder" ? "folder" : "untitled.ts"}
          depth={0}
          icon={
            draft.kind === "folder" ? (
              <FolderPlus className="size-3.5" />
            ) : (
              <FilePlus2 className="size-3.5" />
            )
          }
          ariaLabel={
            draft.kind === "folder"
              ? (labels?.newFolder ?? "New folder name")
              : (labels?.newFile ?? "New file name")
          }
          onCommit={onCommitCreate}
          onCancel={onCancelDraft}
        />
      ) : null}
    </>
  )
}

export function FileTree({
  tree,
  selectedId,
  onSelectionChange,
  defaultExpandedIds = [],
  showLines = true,
  className,
  onFilePreview,
  onFileOpen,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onOpenInTerminal,
  canPaste,
  createRequest,
  labels,
}: FileTreeProps) {
  const selectedIds = selectedId ? [selectedId] : []
  const canCreate = Boolean(onCreateFile || onCreateFolder)
  const [draft, setDraft] = useState<DraftState | null>(null)
  const lastNonce = useRef<number | null>(null)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!createRequest) return
    if (lastNonce.current === createRequest.nonce) return
    lastNonce.current = createRequest.nonce
    setDraft({
      type: "create",
      kind: createRequest.kind,
      parentId: createRequest.parentId,
    })
  }, [createRequest])

  const cancelPreviewSchedule = () => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current)
      previewTimer.current = null
    }
  }

  const schedulePreview = (nodeId: string) => {
    cancelPreviewSchedule()
    previewTimer.current = setTimeout(() => {
      onFilePreview?.(nodeId)
      previewTimer.current = null
    }, 220)
  }

  const startCreate = (kind: FileTreeCreateKind, parentId: string | null) => {
    if (kind === "file" && !onCreateFile) return
    if (kind === "folder" && !onCreateFolder) return
    setDraft({ type: "create", kind, parentId })
  }

  const startRename = (node: IdeTreeNode, depth: number) => {
    if (!onRename) return
    setDraft({
      type: "rename",
      nodeId: node.id,
      name: node.name,
      depth,
    })
  }

  const cancelDraft = () => setDraft(null)

  const commitCreate = (name: string): boolean | void => {
    if (!draft || draft.type !== "create") return false
    const ok =
      draft.kind === "file"
        ? onCreateFile?.(draft.parentId, name)
        : onCreateFolder?.(draft.parentId, name)
    if (ok === false) return false
    setDraft(null)
  }

  const commitRename = (name: string): boolean | void => {
    if (!draft || draft.type !== "rename") return false
    const ok = onRename?.(draft.nodeId, name)
    if (ok === false) return false
    setDraft(null)
  }

  const renameSelected = () => {
    if (!selectedId || !onRename) return
    const find = (nodes: IdeTreeNode[]): IdeTreeNode | null => {
      for (const n of nodes) {
        if (n.id === selectedId) return n
        if (n.children) {
          const hit = find(n.children)
          if (hit) return hit
        }
      }
      return null
    }
    const node = find(tree)
    if (node) startRename(node, 0)
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {/* Action bar above the tree */}
      {canCreate || onRename ? (
        <TooltipProvider delay={300}>
          <div
            className="flex shrink-0 items-center justify-end gap-0.5 border-b border-border/60 px-1.5 py-1"
            data-slot="ide-tree-toolbar"
          >
            {onCreateFile ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={labels?.newFile ?? "New File"}
                      onClick={() => startCreate("file", null)}
                    />
                  }
                >
                  <FilePlus2 className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {labels?.newFile ?? "New File"}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {onCreateFolder ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={labels?.newFolder ?? "New Folder"}
                      onClick={() => startCreate("folder", null)}
                    />
                  }
                >
                  <FolderPlus className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {labels?.newFolder ?? "New Folder"}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {onRename ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={labels?.rename ?? "Rename"}
                      disabled={!selectedId}
                      onClick={renameSelected}
                    />
                  }
                >
                  <Pencil className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {labels?.rename ?? "Rename"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </TooltipProvider>
      ) : null}

      <TreeProvider
        defaultExpandedIds={defaultExpandedIds}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        showLines={showLines}
        animateExpand
        className="min-h-0 flex-1"
      >
        <TreeView className="h-full overflow-auto p-1">
          <TreeBranch
            nodes={tree}
            level={0}
            parentPath={[]}
            draft={draft}
            onStartCreate={startCreate}
            onStartRename={startRename}
            onCommitCreate={commitCreate}
            onCommitRename={commitRename}
            onCancelDraft={cancelDraft}
            onDelete={onDelete}
            onCopy={onCopy}
            onCut={onCut}
            onPaste={onPaste}
            onDuplicate={onDuplicate}
            onOpenInTerminal={onOpenInTerminal}
            canPaste={canPaste}
            onFilePreview={onFilePreview}
            onFileOpen={onFileOpen}
            schedulePreview={schedulePreview}
            cancelPreviewSchedule={cancelPreviewSchedule}
            labels={labels}
          />
        </TreeView>
      </TreeProvider>
    </div>
  )
}

import { useCallback, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type {
  FileTreeCreateRequest,
  IdeTab,
  IdeTreeNode,
} from "@mockmatch/ide"
import {
  defaultExpandedForFormat,
  IDE_FORMAT_PRESETS,
  tabsForFormat,
  treeForFormat,
} from "../constants"
import {
  addFileToTree,
  addFolderToTree,
  collectNodeIds,
  duplicateNodeInTree,
  findTreeNode,
  isFileNode,
  pasteNodeInTree,
  removeNodeFromTree,
  renameNodeInTree,
  tabFromCatalog,
} from "../lib/tree-ops"
import type { IdeFormatSlug } from "../types"

type ClipboardState = {
  node: IdeTreeNode
  mode: "copy" | "cut"
}

function buildCatalog(format: IdeFormatSlug): Map<string, IdeTab> {
  const map = new Map<string, IdeTab>()
  for (const tab of tabsForFormat(format)) {
    map.set(tab.id, { ...tab, preview: false })
  }
  return map
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

export function useSimulationIdeSession(format: IdeFormatSlug) {
  const preset = IDE_FORMAT_PRESETS[format]
  const [tree, setTree] = useState<IdeTreeNode[]>(() => treeForFormat(format))
  const treeRef = useRef(tree)
  treeRef.current = tree

  const defaultExpandedIds = useMemo(
    () => defaultExpandedForFormat(format),
    [format]
  )

  const catalogRef = useRef(buildCatalog(format))
  const clipboardRef = useRef<ClipboardState | null>(null)
  const [canPaste, setCanPaste] = useState(false)

  const seedTabs = useMemo(() => {
    if (!preset.openSeedTabs) return [] as IdeTab[]
    return tabsForFormat(format).map((tab) => ({ ...tab, preview: false }))
  }, [format, preset.openSeedTabs])

  const [tabs, setTabs] = useState<IdeTab[]>(() => seedTabs)
  const [activeTabId, setActiveTabId] = useState<string | undefined>(
    () => seedTabs[0]?.id
  )
  const [selectedTreeId, setSelectedTreeId] = useState<string | undefined>(
    () => seedTabs[0]?.id
  )
  const [showTree, setShowTree] = useState(
    () => preset.treeEnabled && preset.defaultShowTree
  )
  const [createRequest, setCreateRequest] =
    useState<FileTreeCreateRequest | null>(null)

  const requestCreate = useCallback(
    (kind: "file" | "folder", parentId: string | null = null) => {
      setCreateRequest({ kind, parentId, nonce: Date.now() })
      setShowTree(true)
    },
    []
  )

  const syncCatalogFromTab = useCallback((tab: IdeTab) => {
    catalogRef.current.set(tab.id, { ...tab, preview: false })
  }, [])

  const remapTabIds = useCallback((oldId: string, newId: string) => {
    const oldTab = catalogRef.current.get(oldId)
    if (oldTab) {
      catalogRef.current.delete(oldId)
      catalogRef.current.set(newId, {
        ...oldTab,
        id: newId,
        title: newId.includes("/")
          ? newId.slice(newId.lastIndexOf("/") + 1)
          : newId,
      })
    }
    for (const [key, tab] of [...catalogRef.current.entries()]) {
      if (key.startsWith(`${oldId}/`)) {
        const nextKey = `${newId}${key.slice(oldId.length)}`
        catalogRef.current.delete(key)
        catalogRef.current.set(nextKey, {
          ...tab,
          id: nextKey,
        })
      }
    }
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === oldId) {
          return {
            ...t,
            id: newId,
            title: newId.includes("/")
              ? newId.slice(newId.lastIndexOf("/") + 1)
              : newId,
          }
        }
        if (t.id.startsWith(`${oldId}/`)) {
          const nextId = `${newId}${t.id.slice(oldId.length)}`
          return {
            ...t,
            id: nextId,
            title: nextId.includes("/")
              ? nextId.slice(nextId.lastIndexOf("/") + 1)
              : nextId,
          }
        }
        return t
      })
    )
    setActiveTabId((a) => {
      if (!a) return a
      if (a === oldId) return newId
      if (a.startsWith(`${oldId}/`)) return `${newId}${a.slice(oldId.length)}`
      return a
    })
    setSelectedTreeId((s) => {
      if (!s) return s
      if (s === oldId) return newId
      if (s.startsWith(`${oldId}/`)) return `${newId}${s.slice(oldId.length)}`
      return s
    })
  }, [])

  const onTabChange = useCallback(
    (tabId: string, value: string) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== tabId) return tab
          const next = {
            ...tab,
            value,
            dirty: true,
            preview: false,
          }
          syncCatalogFromTab(next)
          return next
        })
      )
    },
    [syncCatalogFromTab]
  )

  const onTreeSelectionChange = useCallback((selectedIds: string[]) => {
    const id = selectedIds[0]
    if (!id) return
    setSelectedTreeId(id)
  }, [])

  const onActiveTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId)
    setSelectedTreeId(tabId)
  }, [])

  const onFilePreview = useCallback(
    (nodeId: string) => {
      const node = findTreeNode(treeRef.current, nodeId)
      if (!node || !isFileNode(node)) return

      setSelectedTreeId(nodeId)
      setTabs((prev) => {
        const permanent = prev.find((t) => t.id === nodeId && !t.preview)
        if (permanent) {
          setActiveTabId(nodeId)
          return prev
        }

        const built = tabFromCatalog(
          catalogRef.current,
          nodeId,
          treeRef.current,
          true
        )
        if (!built) return prev

        const withoutPreview = prev.filter((t) => !t.preview)
        const withoutSame = withoutPreview.filter((t) => t.id !== nodeId)
        setActiveTabId(nodeId)
        return [...withoutSame, built]
      })
    },
    []
  )

  const onFileOpen = useCallback((nodeId: string) => {
    const node = findTreeNode(treeRef.current, nodeId)
    if (!node || !isFileNode(node)) return

    setSelectedTreeId(nodeId)
    setTabs((prev) => {
      const existing = prev.find((t) => t.id === nodeId)
      if (existing) {
        setActiveTabId(nodeId)
        return prev.map((t) =>
          t.id === nodeId ? { ...t, preview: false } : t
        )
      }

      const built = tabFromCatalog(
        catalogRef.current,
        nodeId,
        treeRef.current,
        false
      )
      if (!built) return prev

      const withoutPreview = prev.filter((t) => !t.preview)
      setActiveTabId(nodeId)
      return [...withoutPreview, { ...built, preview: false }]
    })
  }, [])

  const onTabClose = useCallback((tabId: string) => {
    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId)
      setActiveTabId((active) => {
        if (active !== tabId) return active
        return remaining[remaining.length - 1]?.id
      })
      return remaining
    })
  }, [])

  const onTabCloseOthers = useCallback((tabId: string) => {
    setTabs((prev) => {
      const keep = prev.filter((t) => t.id === tabId || t.pinned)
      setActiveTabId(tabId)
      return keep
    })
  }, [])

  const onTabPin = useCallback((tabId: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, pinned: !t.pinned, preview: false } : t
      )
    )
  }, [])

  const onTabCopyPath = useCallback(async (tabId: string) => {
    await writeClipboard(`/${tabId}`)
    toast.success("Copied path", { description: `/${tabId}` })
  }, [])

  const onTabCopyRelativePath = useCallback(async (tabId: string) => {
    await writeClipboard(tabId)
    toast.success("Copied relative path", { description: tabId })
  }, [])

  const onTabReveal = useCallback((tabId: string) => {
    setShowTree(true)
    setSelectedTreeId(tabId)
  }, [])

  const onCreateFile = useCallback(
    (parentId: string | null, name: string): boolean => {
      let ok = false
      setTree((prev) => {
        const result = addFileToTree(prev, parentId, name)
        if (!result) return prev
        ok = true
        catalogRef.current.set(result.nodeId, {
          ...result.tab,
          preview: false,
        })
        setTabs((tabsPrev) => {
          if (tabsPrev.some((t) => t.id === result.nodeId)) {
            return tabsPrev.map((t) =>
              t.id === result.nodeId ? { ...t, preview: false } : t
            )
          }
          return [
            ...tabsPrev.filter((t) => !t.preview),
            { ...result.tab, preview: false },
          ]
        })
        setActiveTabId(result.nodeId)
        setSelectedTreeId(result.nodeId)
        return result.tree
      })
      return ok
    },
    []
  )

  const onCreateFolder = useCallback(
    (parentId: string | null, name: string): boolean => {
      let ok = false
      setTree((prev) => {
        const result = addFolderToTree(prev, parentId, name)
        if (!result) return prev
        ok = true
        setSelectedTreeId(result.nodeId)
        return result.tree
      })
      return ok
    },
    []
  )

  const onDeleteNode = useCallback((nodeId: string) => {
    setTree((prev) => {
      const ids = collectNodeIds(prev, nodeId)
      const next = removeNodeFromTree(prev, nodeId)
      if (!next) return prev

      for (const id of ids) {
        catalogRef.current.delete(id)
      }

      setTabs((tabsPrev) => {
        const remaining = tabsPrev.filter((t) => !ids.includes(t.id))
        setActiveTabId((active) => {
          if (active && ids.includes(active)) {
            return remaining[remaining.length - 1]?.id
          }
          return active
        })
        return remaining
      })
      setSelectedTreeId((selected) => {
        if (selected && ids.includes(selected)) return undefined
        return selected
      })
      return next
    })
  }, [])

  const onRenameNode = useCallback(
    (nodeId: string, name: string): boolean => {
      let ok = false
      setTree((prev) => {
        const result = renameNodeInTree(prev, nodeId, name)
        if (!result) return prev
        ok = true
        if (result.oldId !== result.newId) {
          remapTabIds(result.oldId, result.newId)
        }
        return result.tree
      })
      return ok
    },
    [remapTabIds]
  )

  const onCopyNode = useCallback((nodeId: string) => {
    const node = findTreeNode(treeRef.current, nodeId)
    if (!node) return
    clipboardRef.current = {
      node: structuredClone(node),
      mode: "copy",
    }
    setCanPaste(true)
    toast.success("Copied", { description: node.name })
  }, [])

  const onCutNode = useCallback((nodeId: string) => {
    const node = findTreeNode(treeRef.current, nodeId)
    if (!node) return
    clipboardRef.current = {
      node: structuredClone(node),
      mode: "cut",
    }
    setCanPaste(true)
    toast.success("Cut", { description: node.name })
  }, [])

  const onPasteNode = useCallback((parentId: string | null) => {
    const clip = clipboardRef.current
    if (!clip) return
    setTree((prev) => {
      const result = pasteNodeInTree(prev, clip.node, parentId, clip.mode)
      if (!result) return prev
      if (clip.mode === "cut") {
        clipboardRef.current = null
        setCanPaste(false)
      }
      setSelectedTreeId(result.newId)
      return result.tree
    })
  }, [])

  const onDuplicateNode = useCallback((nodeId: string) => {
    setTree((prev) => {
      const result = duplicateNodeInTree(prev, nodeId)
      if (!result) return prev
      setSelectedTreeId(result.newId)
      return result.tree
    })
  }, [])

  return {
    preset,
    tree,
    defaultExpandedIds,
    tabs,
    activeTabId,
    selectedTreeId,
    showTree,
    setShowTree,
    createRequest,
    requestCreate,
    canPaste,
    onTabChange,
    onTabClose,
    onTabCloseOthers,
    onTabPin,
    onTabCopyPath,
    onTabCopyRelativePath,
    onTabReveal,
    onTreeSelectionChange,
    onActiveTabChange,
    onFilePreview,
    onFileOpen,
    onCreateFile,
    onCreateFolder,
    onDeleteNode,
    onRenameNode,
    onCopyNode,
    onCutNode,
    onPasteNode,
    onDuplicateNode,
  }
}

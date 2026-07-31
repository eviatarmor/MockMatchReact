import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { IdeTab, IdeTreeNode, FileTreeCreateRequest } from "@mockmatch/ide"
import {
  ensureIdeFileYText,
  getIdeFileYText,
  languageFromFileName,
  setIdeWorkspaceTitle,
  setIdeWorkspaceTree,
} from "@mockmatch/ide"
import {
  useCollabYDoc,
  type CollabYSnapshot,
} from "@mockmatch/collab"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import type { CollabPermissions } from "@/features/collab/types"
import { trpc } from "@/lib/trpc"
import {
  addFileToTree,
  addFolderToTree,
  findTreeNode,
  isFileNode,
  removeNodeFromTree,
  renameNodeInTree,
  tabFromCatalog,
} from "@/features/simulation-ide/lib/tree-ops"
import { parseWorkspaceDocument } from "../lib/parse-workspace-document"
import type { IdeWorkspaceDocument } from "@mockmatch/ide"

export type WorkspaceSessionSeed = {
  readonly id: string
  readonly title: string
  readonly document: IdeWorkspaceDocument
  readonly shareToken?: string | null
}

export type WorkspaceSessionOptions = {
  /** Open all seed files as permanent tabs on mount. */
  readonly openSeedTabs?: boolean
  readonly defaultShowTree?: boolean
}

function buildCatalogFromDoc(doc: IdeWorkspaceDocument): Map<string, IdeTab> {
  const map = new Map<string, IdeTab>()
  for (const [path, file] of Object.entries(doc.files)) {
    const title = path.includes("/")
      ? path.slice(path.lastIndexOf("/") + 1)
      : path
    map.set(path, {
      id: path,
      title,
      language: file.language ?? languageFromFileName(title),
      value: file.content,
      preview: false,
    })
  }
  return map
}

function catalogToDocument(
  tree: IdeTreeNode[],
  catalog: Map<string, IdeTab>
): IdeWorkspaceDocument {
  const files: IdeWorkspaceDocument["files"] = {}
  for (const [path, tab] of catalog.entries()) {
    files[path] = {
      language: tab.language,
      content: tab.value,
    }
  }
  return { tree, files }
}

function seedTabsFromDocument(doc: IdeWorkspaceDocument): IdeTab[] {
  return Object.entries(doc.files).map(([path, file]) => {
    const title = path.includes("/")
      ? path.slice(path.lastIndexOf("/") + 1)
      : path
    return {
      id: path,
      title,
      language: file.language ?? languageFromFileName(title),
      value: file.content,
      preview: false,
    }
  })
}

export function useCollabWorkspaceSession(
  seed: WorkspaceSessionSeed,
  options: WorkspaceSessionOptions = {}
) {
  const openSeedTabs = options.openSeedTabs ?? false
  const [title, setTitleState] = useState(seed.title)
  const [tree, setTree] = useState<IdeTreeNode[]>(() => seed.document.tree)
  const treeRef = useRef(tree)
  treeRef.current = tree

  const catalogRef = useRef(buildCatalogFromDoc(seed.document))
  const initialTabs = useMemo(
    () => (openSeedTabs ? seedTabsFromDocument(seed.document) : []),
    // seed.id identity only — document hydrated via collab sync after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed.id, openSeedTabs]
  )
  const [tabs, setTabs] = useState<IdeTab[]>(() => initialTabs)
  const [activeTabId, setActiveTabId] = useState<string | undefined>(
    () => initialTabs[0]?.id
  )
  const [selectedTreeId, setSelectedTreeId] = useState<string | undefined>(
    () => initialTabs[0]?.id
  )
  const [showTree, setShowTree] = useState(
    () => options.defaultShowTree ?? true
  )
  const [createRequest, setCreateRequest] =
    useState<FileTreeCreateRequest | null>(null)
  const skipBroadcast = useRef(false)

  const sendYUpdateRef = useRef<(u: string) => void>(() => {})

  const applyExternalDocument = useCallback((doc: IdeWorkspaceDocument) => {
    skipBroadcast.current = true
    setTree(doc.tree)
    catalogRef.current = buildCatalogFromDoc(doc)
    setTabs((prev) =>
      prev.map((t) => {
        const next = catalogRef.current.get(t.id)
        return next ? { ...next, preview: t.preview, dirty: false } : t
      })
    )
  }, [])

  const onRemoteMaterialize = useCallback(
    (snap: CollabYSnapshot) => {
      skipBroadcast.current = true
      setTitleState(snap.title || seed.title)
      const doc = parseWorkspaceDocument(snap.document)
      applyExternalDocument(doc)
    },
    [applyExternalDocument, seed.title]
  )

  const yjs = useCollabYDoc({
    enabled: true,
    sendUpdate: (u) => sendYUpdateRef.current(u),
    onRemoteMaterialize,
  })

  const lastSnapRef = useRef<CollabYSnapshot | null>(null)
  const applyRemoteUpdateRef = useRef(yjs.applyRemoteUpdate)
  applyRemoteUpdateRef.current = yjs.applyRemoteUpdate
  const seedFromSnapshotRef = useRef(yjs.seedFromSnapshot)
  seedFromSnapshotRef.current = yjs.seedFromSnapshot

  const onSnapshot = useCallback(
    (snap: {
      rev: number
      title: string
      templateId: string
      style: Record<string, unknown>
      document: unknown
    }) => {
      // React only — Y.Doc must come from server yjs.sync (shared CRDT identity).
      lastSnapRef.current = {
        title: snap.title,
        templateId: snap.templateId,
        style: snap.style,
        document: snap.document,
      }
      skipBroadcast.current = true
      setTitleState(snap.title || seed.title)
      applyExternalDocument(parseWorkspaceDocument(snap.document))
    },
    [applyExternalDocument, seed.title]
  )

  const onYjsSync = useCallback((updateB64: string) => {
    applyRemoteUpdateRef.current(updateB64)
  }, [])

  const onYjsUpdate = useCallback((updateB64: string) => {
    applyRemoteUpdateRef.current(updateB64)
  }, [])

  const ydoc = yjs.ydoc

  const collab = useCollabRoom({
    kind: "workspace",
    documentId: seed.id,
    shareToken: seed.shareToken,
    onSnapshot,
    onYjsSync,
    onYjsUpdate,
  })

  sendYUpdateRef.current = collab.sendYUpdate
  const permissions: CollabPermissions = collab.permissions

  // Safety: if server never sent yjs.sync but room is live, seed once from snapshot
  // with REMOTE origin so hasRemoteState allows broadcast. Never seed with local
  // setIdeWorkspaceDocument — that forks CRDT identity and typing never lands on peers.
  useEffect(() => {
    if (!collab.live || !lastSnapRef.current) return
    const root = ydoc.getMap("root")
    if (root.size > 0) return
    seedFromSnapshotRef.current(lastSnapRef.current)
  }, [collab.live, ydoc])

  const setTitle = useCallback(
    (name: string) => {
      if (!permissions.canEditContent) return
      setTitleState(name)
      if (collab.live) setIdeWorkspaceTitle(ydoc, name)
    },
    [permissions.canEditContent, collab.live, ydoc]
  )

  // Solo autosave when not in live collab room
  const updateMut = trpc.ideWorkspaces.update.useMutation()
  const updateMutRef = useRef(updateMut)
  updateMutRef.current = updateMut
  const [soloSaveStatus, setSoloSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  )

  useEffect(() => {
    if (collab.live || collab.status === "connecting") return
    if (!permissions.canEditContent) return
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    setSoloSaveStatus("saving")
    const timer = window.setTimeout(() => {
      const document = catalogToDocument(treeRef.current, catalogRef.current)
      updateMutRef.current
        .mutateAsync({ id: seed.id, title, document })
        .then(() => setSoloSaveStatus("saved"))
        .catch(() => setSoloSaveStatus("error"))
    }, 600)
    return () => window.clearTimeout(timer)
  }, [title, tree, tabs, collab.live, collab.status, permissions.canEditContent, seed.id])

  // Push tree structure into Y when live (files via Y.Text bind)
  useEffect(() => {
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    if (!collab.live || !permissions.canEditContent) return
    const timer = window.setTimeout(() => {
      setIdeWorkspaceTree(ydoc, treeRef.current)
    }, 48)
    return () => window.clearTimeout(timer)
  }, [tree, collab.live, permissions.canEditContent, ydoc])

  const syncCatalogFromTab = useCallback((tab: IdeTab) => {
    catalogRef.current.set(tab.id, { ...tab, preview: false })
  }, [])

  const onTabChange = useCallback(
    (tabId: string, value: string) => {
      if (!permissions.canEditContent) return
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
    [permissions.canEditContent, syncCatalogFromTab]
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

  const openFile = useCallback(
    (nodeId: string, preview: boolean) => {
      const node = findTreeNode(treeRef.current, nodeId)
      if (!node || !isFileNode(node)) return
      setSelectedTreeId(nodeId)
      setTabs((prev) => {
        const permanent = prev.find((t) => t.id === nodeId && !t.preview)
        if (permanent) {
          setActiveTabId(nodeId)
          return prev.map((t) =>
            t.id === nodeId && !preview ? { ...t, preview: false } : t
          )
        }
        let built = catalogRef.current.get(nodeId)
        if (!built) {
          const fromTree = tabFromCatalog(
            catalogRef.current,
            nodeId,
            treeRef.current,
            preview
          )
          built = fromTree ?? {
            id: nodeId,
            title: node.name,
            language: languageFromFileName(node.name),
            value: "",
            preview,
          }
          catalogRef.current.set(nodeId, { ...built, preview: false })
        } else {
          built = { ...built, preview }
        }
        if (preview) {
          const withoutPreview = prev.filter((t) => !t.preview)
          const withoutSame = withoutPreview.filter((t) => t.id !== nodeId)
          setActiveTabId(nodeId)
          return [...withoutSame, built]
        }
        const withoutPreview = prev.filter((t) => !t.preview)
        const withoutSame = withoutPreview.filter((t) => t.id !== nodeId)
        setActiveTabId(nodeId)
        return [...withoutSame, { ...built, preview: false }]
      })
    },
    []
  )

  const onFilePreview = useCallback(
    (nodeId: string) => openFile(nodeId, true),
    [openFile]
  )
  const onFileOpen = useCallback(
    (nodeId: string) => openFile(nodeId, false),
    [openFile]
  )

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

  const requestCreate = useCallback(
    (kind: "file" | "folder", parentId: string | null = null) => {
      if (!permissions.canEditContent) return
      setCreateRequest({ kind, parentId, nonce: Date.now() })
      setShowTree(true)
    },
    [permissions.canEditContent]
  )

  const onCreateFile = useCallback(
    (parentId: string | null, name: string) => {
      if (!permissions.canEditContent) return false
      const result = addFileToTree(treeRef.current, parentId, name)
      if (!result) return false
      setTree(result.tree)
      const tab: IdeTab = { ...result.tab, preview: false }
      catalogRef.current.set(result.nodeId, tab)
      if (collab.live) {
        ensureIdeFileYText(ydoc, result.nodeId, {
          language: tab.language,
          content: "",
        })
      }
      setActiveTabId(result.nodeId)
      setTabs((prev) => [
        ...prev.filter((t) => !t.preview && t.id !== result.nodeId),
        tab,
      ])
      setCreateRequest(null)
      return true
    },
    [permissions.canEditContent, collab.live, ydoc]
  )

  const onCreateFolder = useCallback(
    (parentId: string | null, name: string) => {
      if (!permissions.canEditContent) return false
      const result = addFolderToTree(treeRef.current, parentId, name)
      if (!result) return false
      setTree(result.tree)
      setCreateRequest(null)
      return true
    },
    [permissions.canEditContent]
  )

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      if (!permissions.canEditContent) return
      const next = removeNodeFromTree(treeRef.current, nodeId)
      if (!next) return
      setTree(next)
      // Drop catalog + tabs under path
      for (const key of [...catalogRef.current.keys()]) {
        if (key === nodeId || key.startsWith(`${nodeId}/`)) {
          catalogRef.current.delete(key)
        }
      }
      setTabs((prev) => prev.filter((t) => t.id !== nodeId && !t.id.startsWith(`${nodeId}/`)))
      setActiveTabId((a) =>
        a === nodeId || a?.startsWith(`${nodeId}/`) ? undefined : a
      )
      if (collab.live) {
        // Tree push via effect; remove file entries from Y
        const root = ydoc.getMap("root")
        const document = root.get("document")
        if (document && typeof document === "object" && "get" in document) {
          const files = (document as { get: (k: string) => unknown }).get(
            "files"
          )
          if (files && typeof files === "object" && "delete" in files) {
            ydoc.transact(() => {
              const fmap = files as { delete: (k: string) => void; forEach: (cb: (v: unknown, k: string) => void) => void }
              const keys: string[] = []
              fmap.forEach((_, k) => {
                if (k === nodeId || k.startsWith(`${nodeId}/`)) keys.push(k)
              })
              for (const k of keys) fmap.delete(k)
            })
          }
        }
      }
    },
    [permissions.canEditContent, collab.live, ydoc]
  )

  const onRenameNode = useCallback(
    (nodeId: string, name: string) => {
      if (!permissions.canEditContent) return false
      const result = renameNodeInTree(treeRef.current, nodeId, name)
      if (!result) return false
      setTree(result.tree)
      if (result.newId !== nodeId) {
        const old = catalogRef.current.get(nodeId)
        if (old) {
          catalogRef.current.delete(nodeId)
          catalogRef.current.set(result.newId, {
            ...old,
            id: result.newId,
            title: name,
          })
        }
        setTabs((prev) =>
          prev.map((t) =>
            t.id === nodeId ? { ...t, id: result.newId, title: name } : t
          )
        )
        setActiveTabId((a) => (a === nodeId ? result.newId : a))
      } else {
        const tab = catalogRef.current.get(nodeId)
        if (tab) {
          catalogRef.current.set(nodeId, { ...tab, title: name })
          setTabs((prev) =>
            prev.map((t) => (t.id === nodeId ? { ...t, title: name } : t))
          )
        }
      }
      return true
    },
    [permissions.canEditContent]
  )

  const getYText = useCallback(
    (path: string) => {
      if (!collab.live) return null
      return getIdeFileYText(ydoc, path) ?? ensureIdeFileYText(ydoc, path)
    },
    [collab.live, ydoc]
  )

  const collabBag = useMemo(
    () => ({
      peers: collab.peers,
      sendCursor: collab.sendCursor,
      clearCursor: collab.clearCursor,
      selfUserId: collab.self?.userId,
      enabled: collab.live,
      readOnly: !permissions.canEditContent,
      getYText,
    }),
    [
      collab.peers,
      collab.sendCursor,
      collab.clearCursor,
      collab.self?.userId,
      collab.live,
      permissions.canEditContent,
      getYText,
    ]
  )

  const saveStatus =
    collab.status === "connecting"
      ? ("saving" as const)
      : collab.status === "error" || collab.status === "room_full"
        ? ("error" as const)
        : collab.live
          ? collab.docSaveStatus
          : soloSaveStatus

  return {
    title,
    setTitle,
    tree,
    tabs,
    activeTabId,
    selectedTreeId,
    showTree,
    setShowTree,
    createRequest,
    setCreateRequest,
    requestCreate,
    onTabChange,
    onTreeSelectionChange,
    onActiveTabChange,
    onFilePreview,
    onFileOpen,
    onTabClose,
    onCreateFile,
    onCreateFolder,
    onDeleteNode,
    onRenameNode,
    collab,
    collabBag,
    /** Alias used by simulation-ide-page */
    collabProps: collabBag,
    permissions,
    saveStatus,
    ydoc,
  }
}

export { parseWorkspaceDocument, documentFromTabs } from "../lib/parse-workspace-document"

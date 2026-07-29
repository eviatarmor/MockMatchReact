import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DocumentStyle } from "@/components/document-editor"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import {
  useDocumentHistory,
  type DocumentHistoryControls,
} from "@/hooks/use-document-history"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import {
  applyCollabYSnapshot,
  setCollabDocument,
  setCollabStyle,
  setCollabTemplateId,
  setCollabTitle,
  useCollabYDoc,
  type CollabYSnapshot,
} from "@mockmatch/collab"
import type { CollabPermissions } from "@/features/collab/types"
import { EDITOR_TEMPLATES } from "../constants"
import { parseResumeDocument } from "../lib/parse-resume-document"
import type { EditorTemplateId, ResumeDocument } from "../types"
import { useResumeDocument } from "./use-resume-document"
import { useResumeAutosave, type SaveStatus } from "./use-resume-autosave"
import { useSyncGeneralScore } from "./use-sync-general-score"

export { parseResumeDocument }

interface SessionSeed {
  readonly id: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: ResumeDocument
  readonly shareToken?: string | null
}

type HistorySnapshot = {
  readonly document: ResumeDocument
  readonly style: DocumentStyle
  readonly templateId: EditorTemplateId
  readonly title: string
}

export function useResumeEditorSession(seed: SessionSeed) {
  const { document, handlers, replaceDocument } = useResumeDocument(seed.document)
  const [templateId, setTemplateId] = useState<EditorTemplateId>(seed.templateId)
  const [resumeName, setResumeName] = useState(seed.title)
  const [style, setStyle] = useState<DocumentStyle>(seed.style)
  const skipBroadcast = useRef(false)
  const documentRef = useRef(document)
  documentRef.current = document

  const history = useDocumentHistory<HistorySnapshot>()
  const skipNextRef = useRef(history.skipNext)
  skipNextRef.current = history.skipNext
  const markDiscreteRef = useRef(history.markDiscrete)
  markDiscreteRef.current = history.markDiscrete

  const template =
    EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]

  const applyExternalSnapshot = useCallback(
    (snap: {
      title: string
      templateId: string
      style: unknown
      document: unknown
    }) => {
      skipNextRef.current()
      skipBroadcast.current = true
      setResumeName(snap.title)
      setTemplateId(parseEditorTemplateId(snap.templateId))
      setStyle(parseDocumentStyle(snap.style))
      replaceDocument(parseResumeDocument(snap.document))
    },
    [replaceDocument]
  )

  const onRemoteMaterialize = useCallback(
    (snap: CollabYSnapshot) => {
      applyExternalSnapshot(snap)
    },
    [applyExternalSnapshot]
  )

  const sendYUpdateRef = useRef<(u: string) => void>(() => {})

  const yjs = useCollabYDoc({
    enabled: true,
    sendUpdate: (u) => sendYUpdateRef.current(u),
    onRemoteMaterialize,
  })

  const onSnapshot = useCallback(
    (snap: {
      rev: number
      title: string
      templateId: string
      style: Record<string, unknown>
      document: unknown
    }) => {
      applyExternalSnapshot(snap)
      // Seed Y.Doc from JSON so local merges have structure before/without yjs.sync
      yjs.seedFromSnapshot({
        title: snap.title,
        templateId: snap.templateId,
        style: snap.style,
        document: snap.document,
      })
    },
    [applyExternalSnapshot, yjs]
  )

  const onYjsSync = useCallback(
    (updateB64: string) => {
      yjs.applyRemoteUpdate(updateB64)
    },
    [yjs]
  )

  const onYjsUpdate = useCallback(
    (updateB64: string) => {
      yjs.applyRemoteUpdate(updateB64)
    },
    [yjs]
  )

  const collab = useCollabRoom({
    kind: "resume",
    documentId: seed.id,
    shareToken: seed.shareToken,
    onSnapshot,
    onYjsSync,
    onYjsUpdate,
  })

  sendYUpdateRef.current = collab.sendYUpdate

  const permissions: CollabPermissions = collab.permissions
  const ydoc = yjs.ydoc

  useEffect(() => {
    history.commit({
      document,
      style,
      templateId,
      title: resumeName,
    })
  }, [document, style, templateId, resumeName, history.commit])

  // Structural ops (add/remove/reorder) that only touch React → merge into Y.Doc
  useEffect(() => {
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    if (!permissions.canEditContent || !collab.live) return
    const timer = window.setTimeout(() => {
      setCollabDocument(ydoc, documentRef.current)
    }, 48)
    return () => window.clearTimeout(timer)
  }, [document, permissions.canEditContent, collab.live, ydoc])

  const applyHistorySnapshot = useCallback(
    (snap: HistorySnapshot) => {
      replaceDocument(snap.document)
      setStyle(snap.style)
      setTemplateId(snap.templateId)
      setResumeName(snap.title)
      if (!collab.live) return
      applyCollabYSnapshot(ydoc, {
        title: snap.title,
        templateId: snap.templateId,
        style: snap.style as unknown as Record<string, unknown>,
        document: snap.document,
      })
    },
    [replaceDocument, collab.live, ydoc]
  )

  const historyControls = useMemo<DocumentHistoryControls>(
    () => ({
      undo: () => history.undo(applyHistorySnapshot),
      redo: () => history.redo(applyHistorySnapshot),
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    }),
    [history, applyHistorySnapshot]
  )

  const selectTemplate = (id: EditorTemplateId) => {
    if (!permissions.canEditDesign) return
    markDiscreteRef.current()
    setTemplateId(id)
    const next = EDITOR_TEMPLATES.find((item) => item.id === id)
    if (next) setStyle(next.defaultStyle)
    if (!collab.live) return
    setCollabTemplateId(ydoc, id)
    if (next) {
      setCollabStyle(ydoc, next.defaultStyle as unknown as Record<string, unknown>)
    }
  }

  const updateStyle = (patch: Partial<DocumentStyle>) => {
    if (!permissions.canEditDesign) return
    markDiscreteRef.current()
    setStyle((prev) => {
      const merged = { ...prev, ...patch }
      if (collab.live) {
        setCollabStyle(ydoc, merged as unknown as Record<string, unknown>)
      }
      return merged
    })
  }

  const setResumeNameSafe = (name: string) => {
    if (!permissions.canEditContent) return
    setResumeName(name)
    if (collab.live) setCollabTitle(ydoc, name)
  }

  const liveHandlers = useMemo(() => {
    if (!permissions.canEditContent) {
      const noop = () => {}
      return new Proxy(handlers, {
        get(target, prop) {
          const value = target[prop as keyof typeof target]
          if (typeof value === "function") return noop
          return value
        },
      })
    }

    // Document → Y.Doc is handled by the effect below (single write path).
    return {
      ...handlers,
      addBlock: (
        blockType: (typeof document.sections)[number]["type"],
        afterId?: string
      ) => {
        markDiscreteRef.current()
        handlers.addBlock(blockType, afterId)
      },
      duplicateBlock: (id: string) => {
        markDiscreteRef.current()
        handlers.duplicateBlock(id)
      },
      removeBlock: (id: string) => {
        markDiscreteRef.current()
        handlers.removeBlock(id)
      },
      moveBlock: (id: string, direction: "up" | "down") => {
        markDiscreteRef.current()
        handlers.moveBlock(id, direction)
      },
      reorderBlocks: (activeId: string, overId: string) => {
        markDiscreteRef.current()
        handlers.reorderBlocks(activeId, overId)
      },
    }
  }, [handlers, permissions.canEditContent, document.sections])

  const { status: trpcSaveStatus } = useResumeAutosave({
    resumeId: seed.id,
    title: resumeName,
    templateId,
    style,
    document,
    enabled: !collab.live && collab.status !== "connecting",
  })

  useSyncGeneralScore(seed.id, document, permissions.canEditContent)

  const saveStatus: SaveStatus =
    collab.status === "connecting"
      ? "saving"
      : collab.status === "error" || collab.status === "room_full"
        ? "error"
        : collab.live
          ? collab.docSaveStatus
          : trpcSaveStatus

  const applyRestoredVersion = useCallback(
    (snap: {
      title: string
      templateId: string
      style: unknown
      document: unknown
    }) => {
      markDiscreteRef.current()
      applyExternalSnapshot(snap)
      if (collab.live) {
        applyCollabYSnapshot(ydoc, {
          title: snap.title,
          templateId: snap.templateId,
          style: parseDocumentStyle(snap.style) as unknown as Record<
            string,
            unknown
          >,
          document: parseResumeDocument(snap.document),
        })
      }
    },
    [applyExternalSnapshot, collab.live, ydoc]
  )

  const replaceDocumentFromAi = useCallback(
    (next: ResumeDocument) => {
      if (!permissions.canEditContent) return
      markDiscreteRef.current()
      replaceDocument(next)
      if (collab.live) setCollabDocument(ydoc, next)
    },
    [permissions.canEditContent, replaceDocument, collab.live, ydoc]
  )

  return {
    document,
    handlers: liveHandlers,
    template,
    templateId,
    selectTemplate,
    resumeName,
    setResumeName: setResumeNameSafe,
    style,
    updateStyle,
    saveStatus,
    collab,
    permissions,
    history: historyControls,
    applyRestoredVersion,
    replaceDocument: replaceDocumentFromAi,
    /** Kept for API compat — Yjs materialize drives remote updates in place. */
    documentViewKey: collab.remoteEpoch,
  }
}

export function parseEditorTemplateId(value: string): EditorTemplateId {
  const match = EDITOR_TEMPLATES.find((t) => t.id === value)
  return match?.id ?? "modern"
}

export { parseDocumentStyle }

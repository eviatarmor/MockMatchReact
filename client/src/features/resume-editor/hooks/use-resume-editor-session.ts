import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DocumentStyle } from "@/components/document-editor"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import {
  useDocumentHistory,
  type DocumentHistoryControls,
} from "@/hooks/use-document-history"
import { useCollabRoom } from "@/features/collab/hooks/use-collab-room"
import { setByPath } from "@/features/collab/lib/apply-path-op"
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
  const sendRaf = useRef(0)

  const history = useDocumentHistory<HistorySnapshot>()
  const skipNextRef = useRef(history.skipNext)
  skipNextRef.current = history.skipNext
  const markDiscreteRef = useRef(history.markDiscrete)
  markDiscreteRef.current = history.markDiscrete

  const template = EDITOR_TEMPLATES.find((item) => item.id === templateId) ?? EDITOR_TEMPLATES[0]

  const applyRemoteDocument = useCallback(
    (path: string, value: unknown) => {
      skipNextRef.current()
      skipBroadcast.current = true
      if (path === "document") {
        replaceDocument(parseResumeDocument(value))
        return
      }
      if (path.startsWith("document.")) {
        const root = setByPath(
          { document: documentRef.current } as Record<string, unknown>,
          path,
          value
        )
        replaceDocument(parseResumeDocument(root.document))
      }
    },
    [replaceDocument]
  )

  const onRemoteOp = useCallback(
    (path: string, value: unknown) => {
      if (path === "title") {
        skipNextRef.current()
        setResumeName(String(value ?? ""))
        return
      }
      if (path === "templateId") {
        skipNextRef.current()
        setTemplateId(parseEditorTemplateId(String(value ?? "modern")))
        return
      }
      if (path === "style") {
        skipNextRef.current()
        setStyle(parseDocumentStyle(value))
        return
      }
      applyRemoteDocument(path, value)
    },
    [applyRemoteDocument]
  )

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

  const onSnapshot = useCallback(
    (snap: {
      title: string
      templateId: string
      style: Record<string, unknown>
      document: unknown
    }) => {
      applyExternalSnapshot(snap)
    },
    [applyExternalSnapshot]
  )

  const collab = useCollabRoom({
    kind: "resume",
    documentId: seed.id,
    shareToken: seed.shareToken,
    onRemoteOp,
    onSnapshot,
  })

  const permissions: CollabPermissions = collab.permissions

  useEffect(() => {
    history.commit({
      document,
      style,
      templateId,
      title: resumeName,
    })
  }, [document, style, templateId, resumeName, history.commit])

  // Safety-net broadcast if a mutation path forgets sendDoc (structural ops)
  useEffect(() => {
    if (skipBroadcast.current) {
      skipBroadcast.current = false
      return
    }
    if (!permissions.canEditContent || !collab.live) return
    const timer = window.setTimeout(() => {
      collab.sendOp("document", documentRef.current)
    }, 48)
    return () => window.clearTimeout(timer)
  }, [document, permissions.canEditContent, collab.live, collab.sendOp])

  const applyHistorySnapshot = useCallback(
    (snap: HistorySnapshot) => {
      // document broadcast via existing document effect (skipBroadcast stays false)
      replaceDocument(snap.document)
      setStyle(snap.style)
      setTemplateId(snap.templateId)
      setResumeName(snap.title)
      if (!collab.live) return
      collab.sendOp("style", snap.style)
      collab.sendOp("templateId", snap.templateId)
      collab.sendOp("title", snap.title)
    },
    [replaceDocument, collab.live, collab.sendOp]
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
    collab.sendOp("templateId", id)
    if (next) collab.sendOp("style", next.defaultStyle)
  }

  const updateStyle = (patch: Partial<DocumentStyle>) => {
    if (!permissions.canEditDesign) return
    markDiscreteRef.current()
    setStyle((prev) => {
      const merged = { ...prev, ...patch }
      collab.sendOp("style", merged)
      return merged
    })
  }

  const setResumeNameSafe = (name: string) => {
    if (!permissions.canEditContent) return
    setResumeName(name)
    collab.sendOp("title", name)
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

    // rAF-batch: multiple keystrokes in one frame → one WS message (snappier, less lag)
    const sendDoc = (next: ResumeDocument) => {
      if (!collab.live) return
      documentRef.current = next
      if (sendRaf.current) return
      sendRaf.current = requestAnimationFrame(() => {
        sendRaf.current = 0
        collab.sendOp("document", documentRef.current)
      })
    }

    return {
      ...handlers,
      setHeaderField: (field: "name" | "headline", value: string) => {
        handlers.setHeaderField(field, value)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          header: { ...cur.header, [field]: value },
        })
      },
      setContact: (id: string, value: string) => {
        handlers.setContact(id, value)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          header: {
            ...cur.header,
            contacts: (cur.header.contacts ?? []).map((c) =>
              c.id === id ? { ...c, value } : c
            ),
          },
        })
      },
      updateBlock: (
        id: string,
        patch: Partial<(typeof document.sections)[number]>
      ) => {
        handlers.updateBlock(id, patch)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          sections: cur.sections.map((s) =>
            s.id === id ? ({ ...s, ...patch } as (typeof cur.sections)[number]) : s
          ),
        })
      },
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
  }, [handlers, permissions.canEditContent, collab.live, collab.sendOp, document.sections])

  const { status: trpcSaveStatus } = useResumeAutosave({
    resumeId: seed.id,
    title: resumeName,
    templateId,
    style,
    document,
    enabled: !collab.live && collab.status !== "connecting",
  })

  // Persist the exact general analysis score shown in the editor (structure + grammar).
  useSyncGeneralScore(seed.id, document, permissions.canEditContent)

  // Collab: connection vs document persist are separate — badge follows docSaveStatus
  // while live so typing actually flips Saving → Saved (not stuck on Saved).
  const saveStatus: SaveStatus =
    collab.status === "connecting"
      ? "saving"
      : collab.status === "error" || collab.status === "room_full"
        ? "error"
        : collab.live
          ? collab.docSaveStatus
          : trpcSaveStatus

  /** Apply a restored server snapshot into the live editor (+ collab peers). */
  const applyRestoredVersion = useCallback(
    (snap: {
      title: string
      templateId: string
      style: unknown
      document: unknown
    }) => {
      markDiscreteRef.current()
      applyExternalSnapshot(snap)
      // Broadcast so collab peers pick up the restore
      if (collab.live) {
        collab.sendOp("document", parseResumeDocument(snap.document))
        collab.sendOp("style", parseDocumentStyle(snap.style))
        collab.sendOp("templateId", snap.templateId)
        collab.sendOp("title", snap.title)
      }
    },
    [applyExternalSnapshot, collab.live, collab.sendOp]
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
    /** Kept for API compat — in-place Lexical/input sync; no full remount. */
    documentViewKey: collab.remoteEpoch,
  }
}

export function parseEditorTemplateId(value: string): EditorTemplateId {
  const match = EDITOR_TEMPLATES.find((t) => t.id === value)
  return match?.id ?? "modern"
}

export { parseDocumentStyle }

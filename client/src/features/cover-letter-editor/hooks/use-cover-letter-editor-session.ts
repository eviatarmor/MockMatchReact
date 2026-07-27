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
import type { CoverLetterDocument, EditorTemplateId } from "../types"
import { useCoverLetterDocument } from "./use-cover-letter-document"
import { useCoverLetterAutosave, type SaveStatus } from "./use-cover-letter-autosave"
import { useSyncGeneralScore } from "./use-sync-general-score"

interface SessionSeed {
  readonly id: string
  readonly title: string
  readonly templateId: EditorTemplateId
  readonly style: DocumentStyle
  readonly document: CoverLetterDocument
  readonly shareToken?: string | null
}

type HistorySnapshot = {
  readonly document: CoverLetterDocument
  readonly style: DocumentStyle
  readonly templateId: EditorTemplateId
  readonly title: string
}

export function useCoverLetterEditorSession(seed: SessionSeed) {
  const { document, handlers, replaceDocument } = useCoverLetterDocument(seed.document)
  const [templateId, setTemplateId] = useState<EditorTemplateId>(seed.templateId)
  const [letterName, setLetterName] = useState(seed.title)
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
        replaceDocument(parseCoverLetterDocument(value))
        return
      }
      if (path.startsWith("document.")) {
        const root = setByPath(
          { document: documentRef.current } as Record<string, unknown>,
          path,
          value
        )
        replaceDocument(parseCoverLetterDocument(root.document))
      }
    },
    [replaceDocument]
  )

  const onRemoteOp = useCallback(
    (path: string, value: unknown) => {
      if (path === "title") {
        skipNextRef.current()
        setLetterName(String(value ?? ""))
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
      setLetterName(snap.title)
      setTemplateId(parseEditorTemplateId(snap.templateId))
      setStyle(parseDocumentStyle(snap.style))
      replaceDocument(parseCoverLetterDocument(snap.document))
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
    kind: "cover_letter",
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
      title: letterName,
    })
  }, [document, style, templateId, letterName, history.commit])

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
      setLetterName(snap.title)
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

  const setLetterNameSafe = (name: string) => {
    if (!permissions.canEditContent) return
    setLetterName(name)
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

    const sendDoc = (next: CoverLetterDocument) => {
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
      setSenderField: (field: "name" | "title", value: string) => {
        handlers.setSenderField(field, value)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          sender: { ...cur.sender, [field]: value },
        })
      },
      setContact: (id: string, value: string) => {
        handlers.setContact(id, value)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          sender: {
            ...cur.sender,
            contacts: cur.sender.contacts.map((c) =>
              c.id === id ? { ...c, value } : c
            ),
          },
        })
      },
      setDate: (value: string) => {
        handlers.setDate(value)
        const cur = documentRef.current
        sendDoc({ ...cur, date: value })
      },
      setRecipientField: (field: "name" | "title" | "company", value: string) => {
        handlers.setRecipientField(field, value)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          recipient: { ...cur.recipient, [field]: value },
        })
      },
      updateBlock: (id: string, patch: Partial<(typeof document.blocks)[number]>) => {
        handlers.updateBlock(id, patch)
        const cur = documentRef.current
        sendDoc({
          ...cur,
          blocks: cur.blocks.map((b) =>
            b.id === id ? ({ ...b, ...patch } as (typeof cur.blocks)[number]) : b
          ),
        })
      },
      addBlock: (blockType: (typeof document.blocks)[number]["type"], afterId?: string) => {
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
  }, [handlers, permissions.canEditContent, collab.live, collab.sendOp, document.blocks])

  const { status: trpcSaveStatus } = useCoverLetterAutosave({
    letterId: seed.id,
    title: letterName,
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
        collab.sendOp("document", parseCoverLetterDocument(snap.document))
        collab.sendOp("style", parseDocumentStyle(snap.style))
        collab.sendOp("templateId", snap.templateId)
        collab.sendOp("title", snap.title)
      }
    },
    [applyExternalSnapshot, collab.live, collab.sendOp]
  )

  /** AI assistant (and similar) full-document replacements — undoable + collab. */
  const replaceDocumentFromAi = useCallback(
    (next: CoverLetterDocument) => {
      if (!permissions.canEditContent) return
      markDiscreteRef.current()
      replaceDocument(next)
    },
    [permissions.canEditContent, replaceDocument]
  )

  return {
    document,
    handlers: liveHandlers,
    template,
    templateId,
    selectTemplate,
    letterName,
    setLetterName: setLetterNameSafe,
    style,
    updateStyle,
    saveStatus,
    collab,
    permissions,
    history: historyControls,
    applyRestoredVersion,
    replaceDocument: replaceDocumentFromAi,
    documentViewKey: collab.remoteEpoch,
  }
}

export function parseEditorTemplateId(value: string): EditorTemplateId {
  const match = EDITOR_TEMPLATES.find((t) => t.id === value)
  return match?.id ?? "modern"
}

export function parseCoverLetterDocument(value: unknown): CoverLetterDocument {
  return value as CoverLetterDocument
}

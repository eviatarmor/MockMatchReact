import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  ArrowLeft,
  CloudOff,
  Download,
  Link2Off,
  SearchX,
  Share2,
  type LucideIcon,
} from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  PresenceAvatarStack,
  RemoteCursors,
  RoomFullGate,
  useCollabSurface,
} from "@mockmatch/collab"
import {
  DEFAULT_HIGHLIGHTER_STYLE,
  DEFAULT_PEN_STYLE,
  WhiteboardBottomBar,
  WhiteboardCanvas,
  WhiteboardShell,
  WhiteboardToolRail,
  applyCommand,
  applyTemplateDocument,
  createEmptyBoard,
  createHistory,
  createStencil,
  exportBoardPng,
  isBoardEmpty,
  maxZ,
  useWhiteboardViewport,
  isViewSafeWhiteboardTool,
  type DrawStrokeStyle,
  type ShapeKind,
  type StencilDef,
  type WhiteboardCommand,
  type WhiteboardDocument,
  type WhiteboardTemplate,
  type WhiteboardTemplateId,
  type WhiteboardTool,
} from "@mockmatch/whiteboard"
import { handleWhiteboardHotkey } from "./handle-whiteboard-hotkey"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { trpc } from "@/lib/trpc"
import { practicePathForBankQuestion } from "@/features/simulations/lib/practice-path"
import { useCollabWhiteboardSession } from "./hooks/use-collab-whiteboard-session"
import { useWhiteboardBoardSession } from "./hooks/use-whiteboard-board-session"
import { WhiteboardRail } from "./right-rail/whiteboard-rail"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function templateI18nKey(key: string): string {
  return key
    .replace(/^templates\./, "templatesCatalog.")
    .replace(/\.title$/, ".title")
    .replace(/\.description$/, ".description")
}

export function SimulationWhiteboardPageContent() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-whiteboard", "common"])

  const seedId =
    questionIdParam && UUID_RE.test(questionIdParam) ? questionIdParam : null
  const shareToken =
    searchParams.get("share") || searchParams.get("token") || null

  // Strip legacy boardId from URL (history no longer writes it).
  useEffect(() => {
    if (!searchParams.has("boardId")) return
    const next = new URLSearchParams(searchParams)
    next.delete("boardId")
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const summaryQuery = trpc.questions.get.useQuery(
    { id: seedId! },
    { enabled: Boolean(seedId), retry: false }
  )

  useEffect(() => {
    if (!seedId || !summaryQuery.data) return
    if (summaryQuery.data.format === "whiteboard") return
    const path = practicePathForBankQuestion({
      id: summaryQuery.data.id,
      format: summaryQuery.data.format,
    })
    if (path) navigate(path, { replace: true })
  }, [seedId, summaryQuery.data, navigate])

  const isWhiteboard =
    summaryQuery.data?.format === "whiteboard" && Boolean(seedId)

  // Token → board id (bank share URLs are `/simulations/:questionId?share=` only).
  const shareResolve = trpc.collab.resolveShare.useQuery(
    {
      shareToken: shareToken!,
      questionId: seedId ?? undefined,
      kind: "whiteboard",
    },
    {
      enabled: Boolean(shareToken),
      retry: false,
    }
  )
  const resolvedBoardId =
    shareResolve.data?.kind === "whiteboard"
      ? shareResolve.data.documentId
      : null
  // Share join only — owner always uses openForQuestion (one board per question).
  const existingBoardId = shareToken ? resolvedBoardId : null

  // Claim share before board get (guest must become collaborator first).
  const shareClaim = trpc.collab.getAccess.useQuery(
    {
      kind: "whiteboard",
      id: existingBoardId!,
      shareToken: shareToken || undefined,
    },
    {
      enabled: Boolean(existingBoardId && shareToken),
      retry: false,
    }
  )
  const shareReady =
    !shareToken ||
    ((shareResolve.isSuccess || shareResolve.isError) &&
      (!existingBoardId || shareClaim.isSuccess || shareClaim.isError))
  // Guest share: only open the resolved board — never create a new one.
  const canOpenBoard =
    isWhiteboard && shareReady && (!shareToken || Boolean(existingBoardId))

  const boardSession = useWhiteboardBoardSession({
    questionId: seedId,
    title: summaryQuery.data?.title ?? "Whiteboard",
    enabled: canOpenBoard,
    existingBoardId,
  })

  const historyRef = useRef(createHistory(createEmptyBoard()))
  const [doc, setDoc] = useState<WhiteboardDocument>(() => createEmptyBoard())
  const docRef = useRef(doc)
  docRef.current = doc
  const [tool, setTool] = useState<WhiteboardTool>("select")
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect")
  const [stickyColor, setStickyColor] = useState("#fef08a")
  const [shapeColor, setShapeColor] = useState("#171717")
  const [penStyle, setPenStyle] = useState<DrawStrokeStyle>(DEFAULT_PEN_STYLE)
  const [highlighterStyle, setHighlighterStyle] = useState<DrawStrokeStyle>(
    DEFAULT_HIGHLIGHTER_STYLE
  )
  const [smartStyle, setSmartStyle] =
    useState<DrawStrokeStyle>(DEFAULT_PEN_STYLE)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTemplateId, setActiveTemplateId] =
    useState<WhiteboardTemplateId | null>("blank")
  const [pendingTemplate, setPendingTemplate] =
    useState<WhiteboardTemplate | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const viewport = useWhiteboardViewport()
  const seededRef = useRef(false)
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds

  const accessDocId = boardSession.boardId ?? existingBoardId
  const collabAccess = trpc.collab.getAccess.useQuery(
    {
      kind: "whiteboard",
      id: accessDocId!,
      shareToken: shareToken || undefined,
    },
    { enabled: Boolean(accessDocId), retry: false }
  )

  // Peer materialize: update React only. Never history.replace — that wiped
  // local undo after remote edits. Live undo is Y.UndoManager on the collab Y.Doc.
  const onRemoteDocument = useCallback((remote: WhiteboardDocument) => {
    historyRef.current.setPresent(remote)
    setDoc(remote)
    setSelectedIds([])
    seededRef.current = true
  }, [])

  const collabSession = useCollabWhiteboardSession({
    boardId: boardSession.boardId,
    shareToken,
    onRemoteDocument,
    localDocument: boardSession.ready ? doc : null,
    canEdit: collabAccess.data?.role !== "view",
  })

  const canEditBoard =
    collabAccess.data?.role !== "view" &&
    (!collabSession.live || collabSession.permissions.canEditContent)

  /** Owner/solo default true until access resolves; guests get false once known. */
  const canExportBoard =
    collabAccess.data?.permissions.canExport ?? !shareToken
  /** Share chrome: owners only (dialog still gates paid create-link). Guests never see it. */
  const canShareBoard =
    Boolean(boardSession.boardId) && collabAccess.data?.role === "owner"

  const collabSurface = useCollabSurface(
    collabSession.sendCursor,
    collabSession.clearCursor
  )

  // View guests: snap off edit tools so rail chrome matches canEdit=false.
  useEffect(() => {
    if (canEditBoard) return
    if (!isViewSafeWhiteboardTool(tool)) setTool("select")
  }, [canEditBoard, tool])

  // Bind pointer tracking on the pan/zoom wrapper (same pattern as resume canvas).
  useEffect(() => {
    if (!collabSession.live) return
    let raf = 0
    let cleanup: (() => void) | undefined
    const tryBind = () => {
      const wrapper = viewport.ref.current?.instance?.wrapperComponent ?? null
      if (wrapper) {
        cleanup = collabSurface.bindViewport(wrapper)
        return
      }
      raf = requestAnimationFrame(tryBind)
    }
    tryBind()
    return () => {
      cancelAnimationFrame(raf)
      cleanup?.()
    }
  }, [collabSession.live, collabSurface.bindViewport, viewport.ref])

  useEffect(() => {
    if (!boardSession.ready || !boardSession.seedDoc || seededRef.current) return
    seededRef.current = true
    historyRef.current.replace(boardSession.seedDoc)
    setDoc(boardSession.seedDoc)
  }, [boardSession.ready, boardSession.seedDoc])

  // When leaving a live room, re-seed solo snapshot stack from present.
  const wasLiveRef = useRef(false)
  useEffect(() => {
    if (collabSession.live) {
      wasLiveRef.current = true
      // Live undo flags come from Y.UndoManager
      setCanUndo(collabSession.liveCanUndo)
      setCanRedo(collabSession.liveCanRedo)
      return
    }
    if (wasLiveRef.current) {
      wasLiveRef.current = false
      historyRef.current.replace(docRef.current)
      setCanUndo(false)
      setCanRedo(false)
    }
  }, [
    collabSession.live,
    collabSession.liveCanUndo,
    collabSession.liveCanRedo,
  ])

  const syncHistoryFlags = useCallback(() => {
    if (collabSession.live) {
      setCanUndo(collabSession.liveCanUndo)
      setCanRedo(collabSession.liveCanRedo)
      return
    }
    setCanUndo(historyRef.current.canUndo)
    setCanRedo(historyRef.current.canRedo)
  }, [collabSession.live, collabSession.liveCanUndo, collabSession.liveCanRedo])

  const dispatch = useCallback(
    (command: WhiteboardCommand) => {
      if (!canEditBoard) return
      if (collabSession.live) {
        // Bypass snapshot stack — Y.UndoManager tracks setCollabDocument mirror.
        const next = applyCommand(docRef.current, command)
        if (next === docRef.current) return
        docRef.current = next
        historyRef.current.setPresent(next)
        setDoc(next)
        // Flags update after outbound mirror + UndoManager stack events.
        return
      }
      const next = historyRef.current.dispatch(command)
      docRef.current = next
      setDoc(next)
      syncHistoryFlags()
      if (!collabSession.live) boardSession.scheduleSave(next)
    },
    [boardSession, canEditBoard, syncHistoryFlags, collabSession.live]
  )

  const applyTemplate = useCallback(
    (template: WhiteboardTemplate) => {
      if (!canEditBoard) return
      const nextDoc = applyTemplateDocument(template)
      dispatch({ type: "setDocument", document: nextDoc })
      setActiveTemplateId(template.id)
      setSelectedIds([])
      setPendingTemplate(null)
      // Template content lives near board origin — pan camera there so it is not off-screen
      requestAnimationFrame(() => {
        const els = Object.values(nextDoc.elements)
        if (els.length === 0) {
          viewport.resetView()
          return
        }
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const el of els) {
          if (el.type === "path" || el.type === "connector") continue
          minX = Math.min(minX, el.x)
          minY = Math.min(minY, el.y)
          maxX = Math.max(maxX, el.x + el.w)
          maxY = Math.max(maxY, el.y + el.h)
        }
        if (!Number.isFinite(minX)) {
          viewport.resetView()
          return
        }
        viewport.centerOnBoardPoint((minX + maxX) / 2, (minY + maxY) / 2)
      })
    },
    [canEditBoard, dispatch, viewport]
  )

  const onSelectTemplate = useCallback(
    (template: WhiteboardTemplate) => {
      if (!canEditBoard) return
      if (isBoardEmpty(doc) || template.id === "blank") {
        applyTemplate(template)
        return
      }
      setPendingTemplate(template)
    },
    [applyTemplate, canEditBoard, doc]
  )

  const placeOffsetRef = useRef(0)
  const onPlaceStencil = useCallback(
    (stencil: StencilDef) => {
      if (!canEditBoard) return
      const step = placeOffsetRef.current % 12
      placeOffsetRef.current += 1
      const el = createStencil({
        x: 140 + step * 28,
        y: 140 + step * 28,
        stencilId: stencil.id,
        name: stencil.name,
        svg: stencil.svg,
        nativeW: stencil.w,
        nativeH: stencil.h,
        z: maxZ(doc) + 1,
      })
      dispatch({ type: "upsert", element: el })
      setSelectedIds([el.id])
      setTool("select")
    },
    [canEditBoard, dispatch, doc]
  )

  const undo = useCallback(() => {
    if (!canEditBoard) return
    if (collabSession.live) {
      const next = collabSession.undoLive()
      if (!next) return
      docRef.current = next
      historyRef.current.setPresent(next)
      setDoc(next)
      // canUndo/canRedo sync via liveCanUndo effect after UndoManager stack events
      return
    }
    const next = historyRef.current.undo()
    docRef.current = next
    setDoc(next)
    syncHistoryFlags()
    if (!collabSession.live) boardSession.scheduleSave(next)
  }, [boardSession, canEditBoard, collabSession.live, collabSession.undoLive, syncHistoryFlags])

  const redo = useCallback(() => {
    if (!canEditBoard) return
    if (collabSession.live) {
      const next = collabSession.redoLive()
      if (!next) return
      docRef.current = next
      historyRef.current.setPresent(next)
      setDoc(next)
      return
    }
    const next = historyRef.current.redo()
    docRef.current = next
    setDoc(next)
    syncHistoryFlags()
    if (!collabSession.live) boardSession.scheduleSave(next)
  }, [boardSession, canEditBoard, collabSession.live, collabSession.redoLive, syncHistoryFlags])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      handleWhiteboardHotkey(e, {
        canEditBoard,
        tool,
        getSelectedIds: () => selectedIdsRef.current,
        undo,
        redo,
        removeSelected: (ids) => dispatch({ type: "remove", ids }),
        clearSelection: () => setSelectedIds([]),
        setTool,
        setShapeKind,
      })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canEditBoard, dispatch, redo, tool, undo])

  const toolLabels = useMemo(
    () => ({
      select: t("tools.select"),
      pan: t("tools.pan"),
      draw: t("tools.draw"),
      pen: t("tools.pen"),
      highlighter: t("tools.highlighter"),
      smart: t("tools.smart"),
      eraser: t("tools.eraser"),
      precisionEraser: t("tools.precisionEraser"),
      lasso: t("tools.lasso"),
      sticky: t("tools.sticky"),
      text: t("tools.text"),
      shape: t("tools.shape"),
      connector: t("tools.connector"),
      shapesTitle: t("shapes.title"),
      stickyColor: t("stickyColor"),
      resolveShapeLabel: (key: string) => t(key),
    }),
    [t]
  )

  const drawStyleLabels = useMemo(
    () => ({
      color: t("drawStyle.color"),
      thickness: t("drawStyle.thickness"),
    }),
    [t]
  )

  const shapeLabelLabels = useMemo(
    () => ({
      placeholder: t("shapeLabel.placeholder"),
      bold: t("richText.bold"),
      italic: t("richText.italic"),
      underline: t("richText.underline"),
      list: t("richText.list"),
      link: t("richText.link"),
      clear: t("richText.clear"),
      linkPrompt: t("richText.linkPrompt"),
    }),
    [t]
  )

  const templateLabels = useMemo(
    () => ({
      // Panel chrome already shows title — gallery is body-only
      title: "",
      resolveTitle: (key: string) => t(templateI18nKey(key)),
      resolveDescription: (key: string) => t(templateI18nKey(key)),
    }),
    [t]
  )

  const stencilLabels = useMemo(
    () => ({
      title: "",
      searchPlaceholder: t("stencilsPanel.searchPlaceholder"),
      allCategories: t("stencilsPanel.allCategories"),
      empty: t("stencilsPanel.empty"),
      loading: t("stencilsPanel.loading"),
    }),
    [t]
  )

  const bottomLabels = useMemo(
    () => ({
      undo: t("undo"),
      redo: t("redo"),
      zoomIn: t("zoomIn"),
      zoomOut: t("zoomOut"),
      resetZoom: t("resetView"),
    }),
    [t]
  )

  const onExport = useCallback(async () => {
    if (!canExportBoard) return
    const blob = await exportBoardPng(doc)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `whiteboard-${seedId ?? "board"}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [canExportBoard, doc, seedId])

  const startWbSession = trpc.practiceSessions.startWhiteboard.useMutation()
  const completeMut = trpc.practiceSessions.complete.useMutation()
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!seedId || !isWhiteboard || !boardSession.boardId) return
    let cancelled = false
    void startWbSession
      .mutateAsync({
        questionId: seedId,
        boardId: boardSession.boardId,
        title: summaryQuery.data?.title,
        abandonOpen: false,
      })
      .then((row) => {
        if (cancelled) return
        sessionIdRef.current = row.id
      })
      .catch((err) => {
        if (cancelled) return
        // Board still works without a history row (e.g. guest/share path).
        console.warn("[whiteboard] startWhiteboard practice session failed", err)
        toast.warning(t("errors.historyLinkFailed"), {
          id: "wb-start-history-link-failed",
          description: t("errors.historyLinkFailedDescription"),
        })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedId, isWhiteboard, boardSession.boardId])

  const onEnd = useCallback(async () => {
    boardSession.scheduleSave(doc)
    const sid = sessionIdRef.current
    if (sid) {
      try {
        await completeMut.mutateAsync({ sessionId: sid, score: null })
      } catch {
        /* ignore */
      }
    }
    navigate("/simulations")
  }, [boardSession, completeMut, doc, navigate])

  if (!seedId) {
    return (
      <ErrorPane
        icon={Link2Off}
        title={t("errors.invalidId.title")}
        message={t("errors.invalidId.description")}
        backLabel={t("errors.backToQuestionBank")}
        onBack={() => navigate("/question-bank")}
      />
    )
  }

  if (summaryQuery.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <RobotLoader size="md" label={t("loading")} />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorPane
        icon={SearchX}
        title={t("errors.notFound.title")}
        message={t("errors.notFound.description")}
        backLabel={t("errors.backToQuestionBank")}
        onBack={() => navigate("/question-bank")}
      />
    )
  }

  if (summaryQuery.data.format !== "whiteboard") {
    return (
      <div className="flex h-full items-center justify-center">
        <RobotLoader size="md" label={t("loading")} />
      </div>
    )
  }

  // Guest share: invalid/expired token or wrong document kind → stop infinite load
  if (
    shareToken &&
    shareReady &&
    (shareResolve.isError || !existingBoardId)
  ) {
    return (
      <ErrorPane
        icon={Link2Off}
        title={t("errors.shareInvalid.title")}
        message={t("errors.shareInvalid.description")}
        backLabel={t("errors.backToSimulations")}
        onBack={() => navigate("/simulations")}
      />
    )
  }

  if (boardSession.loadError) {
    return (
      <ErrorPane
        icon={CloudOff}
        title={t("errors.openFailed.title")}
        message={t("errors.openFailed.description")}
        backLabel={t("errors.backToSimulations")}
        onBack={() => navigate("/simulations")}
      />
    )
  }

  // Board open / share resolve still in flight
  if (!boardSession.ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <RobotLoader size="md" label={t("loading")} />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  // Guest: owner left / access revoked (same gates as resume editor).
  if (collabSession.status === "room_full") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={collabSession.roomError}
      />
    )
  }
  if (collabSession.status === "room_closed") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={collabSession.roomError}
        variant="closed"
      />
    )
  }

  const title = summaryQuery.data.title
  const prompt = summaryQuery.data.body?.trim() || t("emptyPrompt")
  const showPresence =
    collabSession.connected ||
    Boolean(collabSession.self) ||
    collabSession.peers.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WhiteboardRail
        prompt={prompt}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={onSelectTemplate}
        templateLabels={templateLabels}
        stencilLabels={stencilLabels}
        onPlaceStencil={onPlaceStencil}
      >
        <WhiteboardShell
          topBar={
            <IdeChromeBar
              leading={
                <TooltipProvider delay={300}>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-8 shrink-0 cursor-pointer"
                          aria-label={t("errors.backToQuestionBank")}
                          onClick={() => navigate("/question-bank")}
                        />
                      }
                    >
                      <ArrowLeft className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t("errors.backToQuestionBank")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              }
              title={title}
              badge={
                <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                  {t("title")}
                </Badge>
              }
              end={
                <>
                  {showPresence ? (
                    <PresenceAvatarStack
                      peers={collabSession.peers}
                      self={collabSession.self}
                    />
                  ) : null}
                  <SaveStatusBadge
                    status={
                      boardSession.saveStatus === "saving"
                        ? "saving"
                        : boardSession.saveStatus === "error"
                          ? "error"
                          : boardSession.saveStatus === "saved"
                            ? "saved"
                            : "idle"
                    }
                    labels={{
                      saved: t("saved"),
                      saving: t("saving"),
                      error: t("common:errors.generic", {
                        defaultValue: "Error",
                      }),
                    }}
                  />
                  <TooltipProvider delay={200}>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {canExportBoard ? (
                        <IconBtn
                          label={t("exportPng")}
                          onClick={() => void onExport()}
                        >
                          <Download className="size-4" />
                        </IconBtn>
                      ) : null}
                      {canShareBoard ? (
                        <IconBtn
                          label={t("share")}
                          onClick={() => setShareOpen(true)}
                        >
                          <Share2 className="size-4" />
                        </IconBtn>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 cursor-pointer gap-1.5"
                        onClick={() => void onEnd()}
                      >
                        {t("endSession")}
                      </Button>
                    </div>
                  </TooltipProvider>
                </>
              }
            />
          }
          toolRail={
            <WhiteboardToolRail
              tool={tool}
              onToolChange={setTool}
              canEdit={canEditBoard}
              labels={toolLabels}
              drawStyleLabels={drawStyleLabels}
              shapeKind={shapeKind}
              onShapeKindChange={setShapeKind}
              penStyle={penStyle}
              highlighterStyle={highlighterStyle}
              smartStyle={smartStyle}
              onPenStyleChange={setPenStyle}
              onHighlighterStyleChange={setHighlighterStyle}
              onSmartStyleChange={setSmartStyle}
              stickyColor={stickyColor}
              onStickyColorChange={(color) => {
                if (!canEditBoard) return
                setStickyColor(color)
                // Recolor selected stickies in one history step
                const stickyIds = selectedIds.filter(
                  (id) => doc.elements[id]?.type === "sticky"
                )
                if (stickyIds.length === 0) return
                const elements = { ...doc.elements }
                for (const id of stickyIds) {
                  const el = elements[id]
                  if (el?.type === "sticky") {
                    elements[id] = { ...el, color }
                  }
                }
                dispatch({
                  type: "setDocument",
                  document: { version: 1, elements },
                })
              }}
              shapeColor={shapeColor}
              onShapeColorChange={(color) => {
                if (!canEditBoard) return
                setShapeColor(color)
                // Recolor selected shapes (stroke) in one history step
                const shapeIds = selectedIds.filter(
                  (id) => doc.elements[id]?.type === "shape"
                )
                if (shapeIds.length === 0) return
                const elements = { ...doc.elements }
                for (const id of shapeIds) {
                  const el = elements[id]
                  if (el?.type === "shape") {
                    elements[id] = { ...el, stroke: color }
                  }
                }
                dispatch({
                  type: "setDocument",
                  document: { version: 1, elements },
                })
              }}
            />
          }
          bottomBar={
            <WhiteboardBottomBar
              viewport={viewport}
              canUndo={canEditBoard && canUndo}
              canRedo={canEditBoard && canRedo}
              onUndo={undo}
              onRedo={redo}
              labels={bottomLabels}
            />
          }
        >
          <WhiteboardCanvas
            document={doc}
            tool={tool}
            viewport={viewport}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            onCommand={dispatch}
            canEdit={canEditBoard}
            shapeKind={shapeKind}
            penStyle={penStyle}
            highlighterStyle={highlighterStyle}
            smartStyle={smartStyle}
            stickyColor={stickyColor}
            shapeColor={shapeColor}
            shapeLabelLabels={shapeLabelLabels}
            surfaceRef={collabSurface.surfaceRef}
            boardOverlay={
              collabSession.live || collabSession.connected ? (
                <RemoteCursors
                  peers={collabSession.peers}
                  surfaceWidth={
                    collabSurface.surfaceSize.w > 1
                      ? collabSurface.surfaceSize.w
                      : 3000
                  }
                  surfaceHeight={
                    collabSurface.surfaceSize.h > 1
                      ? collabSurface.surfaceSize.h
                      : 3000
                  }
                />
              ) : null
            }
          />
        </WhiteboardShell>
      </WhiteboardRail>

      {boardSession.boardId ? (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          kind="whiteboard"
          documentId={boardSession.boardId}
          canShare={collabAccess.data?.canShare ?? false}
          isOwner={collabAccess.data?.role === "owner"}
          isPaidOwner={collabAccess.data?.isPaidOwner ?? false}
          documentTitle={title}
        />
      ) : null}

      <Dialog
        open={Boolean(pendingTemplate)}
        onOpenChange={(open) => {
          if (!open) setPendingTemplate(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("applyTemplateTitle")}</DialogTitle>
            <DialogDescription>{t("applyTemplateConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingTemplate) applyTemplate(pendingTemplate)
              }}
            >
              {t("apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IconBtn({
  label,
  children,
  onClick,
  disabled,
}: {
  readonly label: string
  readonly children: ReactNode
  readonly onClick: () => void
  readonly disabled?: boolean
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
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Full-pane error family — layout matches collab `RoomFullGate` (session ended). */
function ErrorPane({
  icon: Icon,
  title,
  message,
  backLabel,
  onBack,
}: {
  readonly icon: LucideIcon
  readonly title: string
  readonly message: string
  readonly backLabel: string
  readonly onBack: () => void
}) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Icon className="size-10 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  )
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  DEFAULT_HIGHLIGHTER_STYLE,
  DEFAULT_PEN_STYLE,
  WhiteboardBottomBar,
  WhiteboardCanvas,
  WhiteboardShell,
  WhiteboardToolRail,
  applyTemplateDocument,
  createEmptyBoard,
  createHistory,
  exportBoardPng,
  isBoardEmpty,
  shapeKindFromHotkey,
  toolFromHotkey,
  useWhiteboardViewport,
  type DrawStrokeStyle,
  type ShapeKind,
  type WhiteboardDocument,
  type WhiteboardTemplate,
  type WhiteboardTemplateId,
  type WhiteboardTool,
} from "@mockmatch/whiteboard"
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
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-whiteboard", "common"])

  const seedId =
    questionIdParam && UUID_RE.test(questionIdParam) ? questionIdParam : null

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

  const boardSession = useWhiteboardBoardSession({
    questionId: seedId,
    title: summaryQuery.data?.title ?? "Whiteboard",
    enabled: isWhiteboard,
  })

  const historyRef = useRef(createHistory(createEmptyBoard()))
  const [doc, setDoc] = useState<WhiteboardDocument>(() => createEmptyBoard())
  const [tool, setTool] = useState<WhiteboardTool>("select")
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect")
  const [stickyColor, setStickyColor] = useState("#fef08a")
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

  const collabAccess = trpc.collab.getAccess.useQuery(
    {
      kind: "whiteboard",
      id: boardSession.boardId!,
    },
    { enabled: Boolean(boardSession.boardId), retry: false }
  )

  useEffect(() => {
    if (!boardSession.ready || !boardSession.seedDoc || seededRef.current) return
    seededRef.current = true
    historyRef.current.replace(boardSession.seedDoc)
    setDoc(boardSession.seedDoc)
  }, [boardSession.ready, boardSession.seedDoc])

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.canUndo)
    setCanRedo(historyRef.current.canRedo)
  }, [])

  const dispatch = useCallback(
    (command: Parameters<typeof historyRef.current.dispatch>[0]) => {
      const next = historyRef.current.dispatch(command)
      setDoc(next)
      syncHistoryFlags()
      boardSession.scheduleSave(next)
    },
    [boardSession, syncHistoryFlags]
  )

  const applyTemplate = useCallback(
    (template: WhiteboardTemplate) => {
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
    [dispatch, viewport]
  )

  const onSelectTemplate = useCallback(
    (template: WhiteboardTemplate) => {
      if (isBoardEmpty(doc) || template.id === "blank") {
        applyTemplate(template)
        return
      }
      setPendingTemplate(template)
    },
    [applyTemplate, doc]
  )

  const undo = useCallback(() => {
    const next = historyRef.current.undo()
    setDoc(next)
    syncHistoryFlags()
    boardSession.scheduleSave(next)
  }, [boardSession, syncHistoryFlags])

  const redo = useCallback(() => {
    const next = historyRef.current.redo()
    setDoc(next)
    syncHistoryFlags()
    boardSession.scheduleSave(next)
  }, [boardSession, syncHistoryFlags])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable)
      ) {
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0) return
        e.preventDefault()
        dispatch({ type: "remove", ids: selectedIds })
        setSelectedIds([])
        return
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        // Escape → deselect (shape label edit ends via board blur)
        if (e.key === "Escape") {
          e.preventDefault()
          setSelectedIds([])
          setTool("select")
          return
        }
        // Shape shortcuts when shape tool active (R/O/L)
        if (tool === "shape") {
          const sk = shapeKindFromHotkey(e.key)
          if (sk) {
            e.preventDefault()
            setShapeKind(sk)
            return
          }
        }
        const nextTool = toolFromHotkey(e.key, { shiftKey: e.shiftKey })
        if (nextTool) {
          e.preventDefault()
          setTool(nextTool)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dispatch, redo, selectedIds, tool, undo])

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
    const blob = await exportBoardPng(doc)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `whiteboard-${seedId ?? "board"}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [doc, seedId])

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
      .catch(() => {
        /* optional if migration lag */
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
        message={t("errors.invalidId")}
        backLabel={t("errors.backToQuestionBank")}
        onBack={() => navigate("/question-bank")}
      />
    )
  }

  if (summaryQuery.isLoading || (isWhiteboard && !boardSession.ready)) {
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
        message={t("errors.notFound")}
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

  const title = summaryQuery.data.title
  const prompt = summaryQuery.data.body?.trim() || t("emptyPrompt")

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WhiteboardRail
        prompt={prompt}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={onSelectTemplate}
        templateLabels={templateLabels}
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
                      <IconBtn
                        label={t("exportPng")}
                        onClick={() => void onExport()}
                      >
                        <Download className="size-4" />
                      </IconBtn>
                      {boardSession.boardId ? (
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
                setStickyColor(color)
                // Recolor selected sticky notes
                const stickyIds = selectedIds.filter(
                  (id) => doc.elements[id]?.type === "sticky"
                )
                if (stickyIds.length > 0) {
                  for (const id of stickyIds) {
                    dispatch({
                      type: "patch",
                      id,
                      patch: { color } as { color: string },
                    })
                  }
                }
              }}
            />
          }
          bottomBar={
            <WhiteboardBottomBar
              viewport={viewport}
              canUndo={canUndo}
              canRedo={canRedo}
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
            canEdit
            shapeKind={shapeKind}
            penStyle={penStyle}
            highlighterStyle={highlighterStyle}
            smartStyle={smartStyle}
            stickyColor={stickyColor}
            shapeLabelLabels={shapeLabelLabels}
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

function ErrorPane({
  message,
  backLabel,
  onBack,
}: {
  readonly message: string
  readonly backLabel: string
  readonly onBack: () => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  )
}

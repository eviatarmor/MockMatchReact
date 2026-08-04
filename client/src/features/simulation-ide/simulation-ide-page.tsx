import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FlaskConical, Loader2, Play, Share2 } from "lucide-react"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import {
  IdeChromeBar,
  IdeMenubar,
  IdeShell,
  IdeTerminalPanel,
  useColorScheme,
  useIdeSettings,
} from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { PresenceAvatarStack } from "@/features/collab/components/presence-avatar-stack"
import { RoomFullGate } from "@/features/collab/components/room-full-gate"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { useTheme } from "@/components/theme-provider"
import { AskChatSurface } from "@/features/ask/components/ask-chat-surface"
import { trpc } from "@/lib/trpc"
import {
  IDE_FORMAT_PRESETS,
  SHELL_CWD,
  SHELL_WELCOME,
  pathForFormat,
  seedDocumentForFormat,
  shellExerciseCommand,
} from "./constants"
import {
  parseWorkspaceDocument,
  useCollabWorkspaceSession,
  type WorkspaceSessionSeed,
} from "./hooks/use-collab-workspace-session"
import { useBrowserRunActions } from "./hooks/use-browser-run-actions"
import {
  isIdeFormatSlug,
  isPracticeExerciseSlug,
  type IdeFormatSlug,
} from "./types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mockmatch/ui/dialog"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function SimulationIdePageContent() {
  const { format: formatParam, questionId: questionIdParam } = useParams<{
    format?: string
    questionId?: string
  }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isWorkspaceRoute =
    pathname === "/simulations/workspace" ||
    pathname.startsWith("/simulations/workspace/")
  const isTerminalLabRoute =
    pathname === "/simulations/terminal-lab" ||
    pathname.startsWith("/simulations/terminal-lab/")
  /** Bank practice: `/simulations/:questionId` (UUID) or legacy `/practice/`. */
  const isBankPracticeRoute =
    Boolean(questionIdParam && UUID_RE.test(questionIdParam)) ||
    pathname.startsWith("/simulations/practice/")

  const format: string | null = isBankPracticeRoute
    ? "bank"
    : isWorkspaceRoute
      ? "workspace"
      : isTerminalLabRoute
        ? "shell"
        : isPracticeExerciseSlug(formatParam)
          ? formatParam!
          : null

  useEffect(() => {
    if (isWorkspaceRoute || isTerminalLabRoute || isBankPracticeRoute) return
    // Legacy routes → dedicated paths
    if (formatParam === "workspace") {
      navigate(pathForFormat("workspace"), { replace: true })
      return
    }
    if (formatParam === "shell") {
      navigate(pathForFormat("shell"), { replace: true })
      return
    }
    if (!format) {
      navigate("/simulations", { replace: true })
    }
  }, [
    isWorkspaceRoute,
    isTerminalLabRoute,
    isBankPracticeRoute,
    formatParam,
    format,
    navigate,
  ])

  if (!format) {
    return null
  }

  return (
    <ExerciseCollabBootstrap
      format={format}
      bankQuestionId={
        questionIdParam && UUID_RE.test(questionIdParam)
          ? questionIdParam
          : null
      }
    />
  )
}

/**
 * Ensure a durable collab workspace id for any practice format.
 * - Bank: `/simulations/:questionId` loads from `questions` only
 * - Catalog: seed exercise slug
 * - `?id=` + optional `?share=` for join
 * - else check open attempt → Continue / Start new dialog
 */
function ExerciseCollabBootstrap({
  format,
  bankQuestionId,
}: {
  format: string
  bankQuestionId?: string | null
}) {
  const { t } = useTranslation("simulation-ide")
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const shareToken = searchParams.get("share")
  const forceNew = searchParams.get("new") === "1"
  const queryQuestionId = searchParams.get("questionId")
  const questionId =
    bankQuestionId ||
    (queryQuestionId && UUID_RE.test(queryQuestionId) ? queryQuestionId : null)
  const isBank = format === "bank" || Boolean(bankQuestionId)
  const trackKey = isBank && questionId ? `q:${questionId}` : format
  const isValidId = typeof idParam === "string" && UUID_RE.test(idParam)
  const knownPreset = isIdeFormatSlug(format)
    ? IDE_FORMAT_PRESETS[format]
    : null
  /** Seed catalog (not freeform workspace, not bank). */
  const isCatalog = format !== "workspace" && !isBank

  // Non-IDE bank formats must not create IDE workspaces (API rejects them).
  const bankSummary = trpc.questions.get.useQuery(
    { id: questionId! },
    {
      enabled: isBank && Boolean(questionId),
      retry: false,
      staleTime: 60_000,
    }
  )
  const bankFormat = bankSummary.data?.format
  const nonIdeFormats = new Set([
    "mcq",
    "conversation",
    "whiteboard",
    "spreadsheet",
    "page",
  ])
  const bankNeedsRedirect = Boolean(
    bankFormat && nonIdeFormats.has(bankFormat)
  )
  const bankReadyForIde =
    !isBank ||
    (Boolean(bankSummary.data) && !nonIdeFormats.has(bankFormat ?? ""))

  useEffect(() => {
    if (!isBank || !questionId || !bankSummary.data) return
    if (!nonIdeFormats.has(bankSummary.data.format)) return
    // Dispatcher already on unified path for the right surface — leave.
    if (pathname === `/simulations/${questionId}`) return
    navigate(`/simulations/${questionId}`, { replace: true })
  }, [isBank, questionId, bankSummary.data, navigate, pathname])

  const basePath =
    isBank && questionId
      ? `/simulations/${questionId}`
      : pathForFormat(format === "bank" ? "js-sum" : format)

  const [resumePrompt, setResumePrompt] = useState<{
    sessionId: string
    workspaceId: string
    title: string
  } | null>(null)
  const [resumeChecked, setResumeChecked] = useState(
    forceNew || isValidId || Boolean(shareToken)
  )

  const openQuery = trpc.practiceSessions.openForTrack.useQuery(
    { trackId: trackKey },
    {
      enabled:
        bankReadyForIde &&
        !isValidId &&
        !shareToken &&
        !forceNew &&
        Boolean(trackKey),
      retry: false,
      staleTime: 5_000,
    }
  )

  useEffect(() => {
    if (isValidId || shareToken || forceNew) {
      setResumeChecked(true)
      return
    }
    if (openQuery.isLoading) return
    if (openQuery.data?.session?.workspaceId) {
      setResumePrompt({
        sessionId: openQuery.data.session.id,
        workspaceId: openQuery.data.session.workspaceId,
        title: openQuery.data.session.title,
      })
      setResumeChecked(true)
      return
    }
    setResumeChecked(true)
  }, [isValidId, shareToken, forceNew, openQuery.isLoading, openQuery.data])

  const startNew = trpc.practiceSessions.startNew.useMutation({
    onSuccess: (result) => {
      const path =
        isBank && questionId
          ? `/simulations/${questionId}?id=${result.workspaceId}`
          : `${pathForFormat(format)}?id=${result.workspaceId}`
      navigate(path, { replace: true })
    },
  })

  const attachSession = trpc.practiceSessions.attachWorkspace.useMutation()

  const create = trpc.ideWorkspaces.create.useMutation({
    onSuccess: (ws) => {
      attachSession.mutate(
        {
          trackId: trackKey,
          workspaceId: ws.id,
          title: ws.title,
          questionId: questionId ?? undefined,
        },
        {
          onSettled: () => {
            navigate(`${basePath}?id=${ws.id}`, { replace: true })
          },
        }
      )
    },
  })

  const createOnce = useRef(false)
  useEffect(() => {
    if (isValidId || shareToken) return
    if (!resumeChecked || resumePrompt) return
    if (isBank && !bankReadyForIde) return
    if (bankNeedsRedirect) return
    if (
      createOnce.current ||
      startNew.isPending ||
      create.isPending ||
      create.isSuccess
    )
      return

    if (isBank) {
      if (!questionId) return
      createOnce.current = true
      startNew.mutate({
        questionId,
        abandonOpen: true,
      })
      return
    }

    // Seed catalog — startNew loads exercise server-side
    if (isCatalog) {
      createOnce.current = true
      startNew.mutate({
        trackId: format,
        abandonOpen: true,
      })
      return
    }

    createOnce.current = true
    create.mutate({
      title: knownPreset ? t(knownPreset.titleKey) : format,
      templateId: format,
      document: isIdeFormatSlug(format)
        ? seedDocumentForFormat(format)
        : undefined,
    })
  }, [
    isValidId,
    shareToken,
    resumeChecked,
    resumePrompt,
    create,
    startNew,
    t,
    format,
    knownPreset,
    isCatalog,
    isBank,
    questionId,
    bankReadyForIde,
    bankNeedsRedirect,
  ])

  if (isBank && bankSummary.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("collab.preparing")} />
        {t("collab.preparing")}
      </div>
    )
  }

  // Wrong surface (e.g. deep link race) — redirect effect handles navigation.
  if (isBank && bankNeedsRedirect) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("collab.preparing")} />
        {t("collab.preparing")}
      </div>
    )
  }

  if (shareToken && !isValidId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        {t("collab.badShareLink")}
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/simulations")}
        >
          {t("collab.backToSimulations")}
        </Button>
      </div>
    )
  }

  if (resumePrompt && !isValidId) {
    return (
      <Dialog open>
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {t("resume.title", { defaultValue: "Continue previous session?" })}
            </DialogTitle>
            <DialogDescription>
              {t("resume.description", {
                title: resumePrompt.title,
                defaultValue:
                  "You have an unfinished attempt for this exercise. Continue where you left off, or start a new attempt.",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setResumePrompt(null)
                createOnce.current = false
                startNew.mutate(
                  isBank && questionId
                    ? { questionId, abandonOpen: true }
                    : { trackId: format, abandonOpen: true }
                )
              }}
              disabled={startNew.isPending}
            >
              {t("resume.startNew", { defaultValue: "Start new" })}
            </Button>
            <Button
              className="cursor-pointer"
              onClick={() => {
                navigate(`${basePath}?id=${resumePrompt.workspaceId}`, {
                  replace: true,
                })
              }}
            >
              {t("resume.continue", { defaultValue: "Continue" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  if (!isValidId) {
    const startFailed = startNew.isError || create.isError
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        {startFailed ? (
          <>
            {t("collab.createError")}
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate("/simulations")}
            >
              {t("collab.backToSimulations")}
            </Button>
          </>
        ) : (
          <>
            <RobotLoader size="md" label={t("collab.preparing")} />
            {t("collab.preparing")}
          </>
        )}
      </div>
    )
  }

  return (
    <ExerciseCollabLoader
      format={isBank ? "js-sum" : format}
      catalogSlug={isBank ? undefined : format}
      bankQuestionId={isBank ? questionId : null}
      workspaceId={idParam}
      shareToken={shareToken}
    />
  )
}

function ExerciseCollabLoader({
  format,
  catalogSlug,
  bankQuestionId,
  workspaceId,
  shareToken,
}: {
  format: string
  catalogSlug?: string
  bankQuestionId?: string | null
  workspaceId: string
  shareToken: string | null
}) {
  const { t } = useTranslation("simulation-ide")
  const navigate = useNavigate()

  const access = trpc.collab.getAccess.useQuery(
    {
      kind: "workspace",
      id: workspaceId,
      shareToken: shareToken || undefined,
    },
    { enabled: Boolean(shareToken), retry: false }
  )

  const query = trpc.ideWorkspaces.get.useQuery(
    { id: workspaceId },
    {
      enabled: !shareToken || access.isSuccess || access.isError,
      retry: false,
    }
  )

  useEffect(() => {
    if (bankQuestionId) return
    if (!query.data?.templateId) return
    const stored = query.data.templateId
    if (stored.startsWith("q:")) return
    if (isIdeFormatSlug(stored) && stored !== format) {
      const qs = new URLSearchParams()
      qs.set("id", workspaceId)
      if (shareToken) qs.set("share", shareToken)
      navigate(`${pathForFormat(stored)}?${qs.toString()}`, {
        replace: true,
      })
    }
  }, [
    query.data?.templateId,
    format,
    workspaceId,
    shareToken,
    navigate,
    bankQuestionId,
  ])

  if (query.isLoading || (shareToken && access.isLoading)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("collab.loading")} />
        {t("collab.loading")}
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
        {t("collab.loadError")}
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/simulations")}
        >
          {t("collab.backToSimulations")}
        </Button>
      </div>
    )
  }

  const seed: WorkspaceSessionSeed = {
    id: query.data.id,
    title: query.data.title,
    document: parseWorkspaceDocument(query.data.document),
    shareToken,
  }

  if (format === "shell" || query.data.templateId === "shell") {
    return (
      <ShellCollabSession key={seed.id} seed={seed} format="shell" />
    )
  }

  const editorFormat: Exclude<IdeFormatSlug, "shell"> = isIdeFormatSlug(format)
    ? (format as Exclude<IdeFormatSlug, "shell">)
    : "js-sum"

  return (
    <EditorCollabSession
      key={seed.id}
      seed={seed}
      format={editorFormat}
      catalogSlug={
        bankQuestionId
          ? undefined
          : isIdeFormatSlug(catalogSlug ?? format)
            ? (catalogSlug ?? format)
            : undefined
      }
      bankQuestionId={bankQuestionId}
    />
  )
}

function useCollabHeaderAccess(seed: WorkspaceSessionSeed) {
  const access = trpc.collab.getAccess.useQuery(
    {
      kind: "workspace",
      id: seed.id,
      shareToken: seed.shareToken || undefined,
    },
    { staleTime: 30_000 }
  )
  return {
    isOwner: access.data?.role === "owner",
    canShare: Boolean(access.data?.canShare),
    isPaidOwner: Boolean(
      access.data?.isPaidOwner ?? access.data?.isOwnerPaid
    ),
  }
}

function CollabRoomGates({
  status,
  roomError,
  children,
}: {
  status: string
  roomError: string | null
  children: ReactNode
}) {
  if (status === "room_full") {
    return (
      <RoomFullGate backHref="/simulations" message={roomError} />
    )
  }
  if (status === "room_closed") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={roomError}
        variant="closed"
      />
    )
  }
  return children
}

/** Full IDE / Monaco-only collab exercises (react, cpp-sort, workspace). */
function EditorCollabSession({
  seed,
  format,
  catalogSlug,
  bankQuestionId,
}: {
  seed: WorkspaceSessionSeed
  format: Exclude<IdeFormatSlug, "shell">
  /** Seed catalog slug for runtime/tests. */
  catalogSlug?: string
  /** Bank question id — load uiFlags from questions.forPractice. */
  bankQuestionId?: string | null
}) {
  const { t } = useTranslation("simulation-ide")
  const { resolvedTheme } = useTheme()
  const preset = IDE_FORMAT_PRESETS[format]
  const bankQuery = trpc.questions.forPractice.useQuery(
    { id: bankQuestionId! },
    {
      enabled: Boolean(bankQuestionId),
      staleTime: 60_000,
      retry: false,
    }
  )
  const exerciseQuery = trpc.practiceExercises.bySlug.useQuery(
    { slug: catalogSlug ?? format },
    {
      enabled: !bankQuestionId && (Boolean(catalogSlug) || format !== "workspace"),
      staleTime: 60_000,
      retry: false,
    }
  )
  const uiFlags = bankQuery.data?.uiFlags ?? exerciseQuery.data?.uiFlags
  const session = useCollabWorkspaceSession(seed, {
    openSeedTabs: uiFlags?.openSeedTabs ?? preset.openSeedTabs,
    defaultShowTree: uiFlags?.defaultShowTree ?? preset.defaultShowTree,
  })
  const { settings, patchSettings, setSettings } = useIdeSettings()
  const pageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showTerminal, setShowTerminal] = useState(
    uiFlags?.defaultShowTerminal ?? preset.defaultShowTerminal
  )
  const [showAi, setShowAi] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { isOwner, canShare, isPaidOwner } = useCollabHeaderAccess(seed)

  const treeEnabled = uiFlags?.treeEnabled ?? preset.treeEnabled
  const tabsClosable = uiFlags?.tabsClosable ?? preset.tabsClosable

  const toggleFullscreen = useCallback(async () => {
    const el = pageRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      // blocked
    }
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const saveLabels = useMemo(
    () => ({
      saved: t("collab.saved"),
      saving: t("collab.saving"),
      error: t("collab.saveError"),
    }),
    [t]
  )

  const labels = useIdeLabels(t)
  const runtimeOverride = useMemo(() => {
    if (!uiFlags) return null
    const lang = uiFlags.runtimeLanguage
    const asRuntime:
      | "typescript"
      | "javascript"
      | "python"
      | "cpp"
      | "nodejs"
      | undefined =
      lang === "typescript" ||
      lang === "javascript" ||
      lang === "python" ||
      lang === "cpp" ||
      lang === "nodejs"
        ? lang
        : lang === "ts"
          ? "typescript"
          : lang === "js"
            ? "javascript"
            : lang === "py"
              ? "python"
              : undefined
    return {
      language: asRuntime,
      entryPath: uiFlags.entryPath,
      tests: uiFlags.tests,
    }
  }, [uiFlags])
  const run = useBrowserRunActions({
    preset,
    activeTabId: session.activeTabId,
    getFilesSnapshot: session.getFilesSnapshot,
    setShowTerminal,
    runtimeOverride,
  })

  return (
    <CollabRoomGates
      status={session.collab.status}
      roomError={session.collab.roomError}
    >
      <div ref={pageRef} className="flex h-full min-h-0 flex-col bg-background">
        <IdeChromeBar
          title={
            <h1 className="shrink-0 text-sm font-medium text-foreground">
              {session.title || t(preset.titleKey)}
            </h1>
          }
          badge={
            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
              {t(preset.badgeKey)}
            </Badge>
          }
          start={
            <IdeMenubar
              className="shrink-0"
              settings={settings}
              onPatchSettings={patchSettings}
              showTree={treeEnabled ? session.showTree : undefined}
              treeToggleable={treeEnabled}
              onToggleTree={
                treeEnabled
                  ? () => session.setShowTree(!session.showTree)
                  : undefined
              }
              showTerminal={showTerminal}
              onToggleTerminal={() => setShowTerminal((v) => !v)}
              showAi={showAi}
              onToggleAi={() => setShowAi((v) => !v)}
              fullscreen={fullscreen}
              onToggleFullscreen={() => void toggleFullscreen()}
              onCreateFile={
                treeEnabled ? () => session.requestCreate("file") : undefined
              }
              onCreateFolder={
                treeEnabled ? () => session.requestCreate("folder") : undefined
              }
              hideRunMenu
              labels={labels}
            />
          }
          center={
            <TooltipProvider delay={300}>
              <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-8 cursor-pointer gap-1.5 px-3"
                        disabled={run.runBusy || run.runTestsBusy}
                        onClick={run.onRun}
                        aria-label={t("actions.run")}
                      />
                    }
                  >
                    {run.runBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5 fill-current" />
                    )}
                    <span>{t("actions.run")}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("actions.run")}
                    <span className="ml-1.5 opacity-70">F5</span>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 cursor-pointer gap-1.5 px-3"
                        data-slot="ide-run-tests"
                        disabled={run.runBusy || run.runTestsBusy}
                        onClick={run.onRunTests}
                        aria-label={t("actions.runTests")}
                      />
                    }
                  >
                    {run.runTestsBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FlaskConical className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {t("actions.runTests")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("actions.runTests")}
                    <span className="ml-1.5 opacity-70">Ctrl+Shift+Enter</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          }
          end={
            <>
              <SaveStatusBadge status={session.saveStatus} labels={saveLabels} />
              <PresenceAvatarStack
                peers={session.collab.peers}
                self={session.collab.self}
              />
              {isOwner && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 cursor-pointer gap-1.5"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="size-3.5" />
                  <span className="hidden sm:inline">{t("collab.share")}</span>
                </Button>
              )}
            </>
          }
        />
        <div className="min-h-0 flex-1">
          <IdeShell
            className="h-full min-h-0"
            hideMenubar
            fullscreen={fullscreen}
            onFullscreenChange={setFullscreen}
            fullscreenTargetRef={pageRef}
            tree={treeEnabled ? session.tree : undefined}
            showTree={treeEnabled ? session.showTree : false}
            onShowTreeChange={treeEnabled ? session.setShowTree : undefined}
            treeToggleable={treeEnabled}
            selectedTreeId={treeEnabled ? session.selectedTreeId : undefined}
            onTreeSelectionChange={
              treeEnabled ? session.onTreeSelectionChange : undefined
            }
            onCreateFile={treeEnabled ? session.onCreateFile : undefined}
            onCreateFolder={treeEnabled ? session.onCreateFolder : undefined}
            onDeleteNode={treeEnabled ? session.onDeleteNode : undefined}
            onRenameNode={treeEnabled ? session.onRenameNode : undefined}
            createRequest={treeEnabled ? session.createRequest : undefined}
            onFilePreview={treeEnabled ? session.onFilePreview : undefined}
            onFileOpen={treeEnabled ? session.onFileOpen : undefined}
            tabs={session.tabs}
            activeTabId={session.activeTabId}
            onActiveTabChange={session.onActiveTabChange}
            onTabChange={session.onTabChange}
            onTabClose={tabsClosable ? session.onTabClose : undefined}
            tabsClosable={tabsClosable}
            colorScheme={resolvedTheme}
            settings={settings}
            onSettingsChange={setSettings}
            showTerminal={showTerminal}
            onShowTerminalChange={setShowTerminal}
            terminalFeed={run.terminalFeed}
            showAi={showAi}
            onShowAiChange={setShowAi}
            aiPanel={({ close }) => (
              <AskChatSurface
                chrome="surface"
                onClose={close}
                showSuggestions={false}
              />
            )}
            onRun={run.onRun}
            onRunTests={run.onRunTests}
            runBusy={run.runBusy}
            runTestsBusy={run.runTestsBusy}
            runActionsPlacement="none"
            labels={labels}
            collab={session.collabProps}
          />
        </div>
        {isOwner && (
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            kind="workspace"
            documentId={seed.id}
            documentTitle={session.title}
            canShare={canShare}
            isOwner={isOwner}
            isPaidOwner={isPaidOwner}
          />
        )}
      </div>
    </CollabRoomGates>
  )
}

/** Shell-only collab exercise — presence + share; multi-tab terminal. */
function ShellCollabSession({
  seed,
  format,
}: {
  seed: WorkspaceSessionSeed
  format: "shell"
}) {
  const { t } = useTranslation("simulation-ide")
  const { resolvedTheme } = useTheme()
  const scheme = useColorScheme(
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? resolvedTheme
      : "auto"
  )
  const preset = IDE_FORMAT_PRESETS[format]
  const session = useCollabWorkspaceSession(seed, {
    openSeedTabs: false,
    defaultShowTree: false,
  })
  /** Catalog metadata (welcome, virtual FS for cat/ls). */
  const exerciseQuery = trpc.practiceExercises.bySlug.useQuery(
    { slug: "shell" },
    { staleTime: 60_000, retry: false }
  )
  const pageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { isOwner, canShare, isPaidOwner } = useCollabHeaderAccess(seed)

  const shellWelcome =
    exerciseQuery.data?.uiFlags?.shellWelcome ?? SHELL_WELCOME
  const shellCwd = exerciseQuery.data?.uiFlags?.shellCwd ?? SHELL_CWD
  const shellFiles = exerciseQuery.data?.files ?? {}

  const toggleFullscreen = useCallback(async () => {
    const el = pageRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      // blocked
    }
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const saveLabels = useMemo(
    () => ({
      saved: t("collab.saved"),
      saving: t("collab.saving"),
      error: t("collab.saveError"),
    }),
    [t]
  )

  const onCommand = useCallback(
    (command: string) => {
      return shellExerciseCommand(command, {
        cwd: shellCwd,
        files: shellFiles,
      })
    },
    [shellCwd, shellFiles]
  )

  return (
    <CollabRoomGates
      status={session.collab.status}
      roomError={session.collab.roomError}
    >
      <div ref={pageRef} className="flex h-full min-h-0 flex-col bg-background">
        <IdeChromeBar
          title={
            <h1 className="shrink-0 text-sm font-medium text-foreground">
              {session.title ||
                exerciseQuery.data?.title ||
                t(preset.titleKey)}
            </h1>
          }
          badge={
            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
              {t(preset.badgeKey)}
            </Badge>
          }
          center={
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {exerciseQuery.data?.description || t(preset.descriptionKey)}
            </p>
          }
          end={
            <>
              <SaveStatusBadge status={session.saveStatus} labels={saveLabels} />
              <PresenceAvatarStack
                peers={session.collab.peers}
                self={session.collab.self}
              />
              {isOwner && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 cursor-pointer gap-1.5"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="size-3.5" />
                  <span className="hidden sm:inline">{t("collab.share")}</span>
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 cursor-pointer"
                onClick={() => void toggleFullscreen()}
              >
                {fullscreen
                  ? t("actions.exitFullscreen")
                  : t("actions.fullscreen")}
              </Button>
            </>
          }
        />
        <div className="min-h-0 flex-1 bg-background p-0">
          <IdeTerminalPanel
            layout="fill"
            open
            onOpenChange={() => {}}
            colorScheme={scheme}
            welcome={shellWelcome}
            defaultCwd={shellCwd}
            onCommand={onCommand}
            labels={{
              newTerminal: t("actions.newTerminal"),
              closeTerminal: t("actions.closeTerminal"),
              close: t("actions.close"),
              closeOthers: t("actions.closeOthers"),
              pinTab: t("actions.pinTab"),
              unpinTab: t("actions.unpinTab"),
            }}
          />
        </div>
        {isOwner && (
          <ShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            kind="workspace"
            documentId={seed.id}
            documentTitle={session.title}
            canShare={canShare}
            isOwner={isOwner}
            isPaidOwner={isPaidOwner}
          />
        )}
      </div>
    </CollabRoomGates>
  )
}

function useIdeLabels(t: ReturnType<typeof useTranslation>["t"]) {
  return {
    toggleTree: t("actions.toggleTree"),
    toggleTerminal: t("actions.toggleTerminal"),
    ligatures: t("actions.ligatures"),
    wordWrap: t("actions.wordWrap"),
    minimap: t("actions.minimap"),
    lineNumbers: t("actions.lineNumbers"),
    fontSize: t("actions.fontSize"),
    tabSize: t("actions.tabSize"),
    whitespace: t("actions.whitespace"),
    bracketColors: t("actions.bracketColors"),
    emptyEditor: t("emptyEditor"),
    fullscreen: t("actions.fullscreen"),
    exitFullscreen: t("actions.exitFullscreen"),
    toggleAi: t("actions.toggleAi"),
    resizeAi: t("actions.resizeAi"),
    newFile: t("actions.newFile"),
    newFolder: t("actions.newFolder"),
    delete: t("actions.delete"),
    rename: t("actions.rename"),
    cut: t("actions.cut"),
    copy: t("actions.copy"),
    paste: t("actions.paste"),
    duplicate: t("actions.duplicate"),
    close: t("actions.close"),
    closeOthers: t("actions.closeOthers"),
    copyPath: t("actions.copyPath"),
    copyRelativePath: t("actions.copyRelativePath"),
    pinTab: t("actions.pinTab"),
    unpinTab: t("actions.unpinTab"),
    revealInExplorer: t("actions.revealInExplorer"),
    openInTerminal: t("actions.openInTerminal"),
    splitMenu: t("actions.splitMenu"),
    splitRight: t("actions.splitRight"),
    splitLeft: t("actions.splitLeft"),
    splitUp: t("actions.splitUp"),
    splitDown: t("actions.splitDown"),
    unsplit: t("actions.unsplit"),
    viewMenu: t("actions.viewMenu"),
    editorMenu: t("actions.editorMenu"),
    fileMenu: t("actions.fileMenu"),
    themeMenu: t("actions.themeMenu"),
    themeAuto: t("actions.themeAuto"),
    themeLight: t("actions.themeLight"),
    themeDark: t("actions.themeDark"),
    themeHighContrast: t("actions.themeHighContrast"),
    resizeTree: t("actions.resizeTree"),
    resizeTerminal: t("actions.resizeTerminal"),
    terminalTitle: t("actions.terminalTitle"),
    newTerminal: t("actions.newTerminal"),
    closeTerminal: t("actions.closeTerminal"),
    run: t("actions.run"),
    runTests: t("actions.runTests"),
    runMenu: t("actions.runMenu"),
  }
}

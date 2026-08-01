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
  isCodeRunFormatSlug,
  isIdeFormatSlug,
  type IdeFormatSlug,
} from "./types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function SimulationIdePageContent() {
  const { format: formatParam } = useParams<{ format: string }>()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isWorkspaceRoute =
    pathname === "/simulations/workspace" ||
    pathname.startsWith("/simulations/workspace/")
  const isTerminalLabRoute =
    pathname === "/simulations/terminal-lab" ||
    pathname.startsWith("/simulations/terminal-lab/")

  const format: IdeFormatSlug | null = isWorkspaceRoute
    ? "workspace"
    : isTerminalLabRoute
      ? "shell"
      : isCodeRunFormatSlug(formatParam)
        ? formatParam
        : null

  useEffect(() => {
    if (isWorkspaceRoute || isTerminalLabRoute) return
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
    formatParam,
    format,
    navigate,
  ])

  if (!format) {
    return null
  }

  return <ExerciseCollabBootstrap format={format} />
}

/**
 * Ensure a durable collab workspace id for any practice format.
 * - `?id=` + optional `?share=` for join
 * - else create one and replace into URL
 */
function ExerciseCollabBootstrap({ format }: { format: IdeFormatSlug }) {
  const { t } = useTranslation("simulation-ide")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const shareToken = searchParams.get("share")
  const isValidId = typeof idParam === "string" && UUID_RE.test(idParam)
  const preset = IDE_FORMAT_PRESETS[format]
  /** Catalog exercises (not freeform workspace) load seed from DB/S3. */
  const isCatalog = format !== "workspace"

  const exerciseQuery = trpc.practiceExercises.bySlug.useQuery(
    { slug: format },
    {
      enabled: isCatalog && !isValidId && !shareToken,
      retry: false,
      staleTime: 60_000,
    }
  )

  const create = trpc.ideWorkspaces.create.useMutation({
    onSuccess: (ws) => {
      navigate(`${pathForFormat(format)}?id=${ws.id}`, { replace: true })
    },
  })

  const createOnce = useRef(false)
  useEffect(() => {
    if (isValidId || shareToken) return
    if (createOnce.current || create.isPending || create.isSuccess) return

    if (isCatalog) {
      if (exerciseQuery.isLoading || exerciseQuery.isError) return
      if (!exerciseQuery.data) return
      createOnce.current = true
      create.mutate({
        title: exerciseQuery.data.title,
        templateId: format,
        document: exerciseQuery.data.document as {
          tree: never
          files: Record<string, { language?: string; content: string }>
        },
      })
      return
    }

    createOnce.current = true
    create.mutate({
      title: t(preset.titleKey),
      templateId: format,
      document: seedDocumentForFormat(format),
    })
  }, [
    isValidId,
    shareToken,
    create,
    t,
    format,
    preset.titleKey,
    isCatalog,
    exerciseQuery.isLoading,
    exerciseQuery.isError,
    exerciseQuery.data,
  ])

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

  if (!isValidId) {
    const exerciseFailed = isCatalog && exerciseQuery.isError
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
        {exerciseFailed || create.isError ? (
          <>
            {exerciseFailed
              ? t("collab.loadError")
              : t("collab.createError")}
            <p className="max-w-md text-center text-xs">
              {exerciseFailed
                ? "Run: cd api && npm run db:migrate && npm run db:seed:exercises"
                : null}
            </p>
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
      format={format}
      workspaceId={idParam}
      shareToken={shareToken}
    />
  )
}

function ExerciseCollabLoader({
  format,
  workspaceId,
  shareToken,
}: {
  format: IdeFormatSlug
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
    if (!query.data?.templateId) return
    const stored = query.data.templateId
    if (isIdeFormatSlug(stored) && stored !== format) {
      const qs = new URLSearchParams()
      qs.set("id", workspaceId)
      if (shareToken) qs.set("share", shareToken)
      navigate(`${pathForFormat(stored)}?${qs.toString()}`, {
        replace: true,
      })
    }
  }, [query.data?.templateId, format, workspaceId, shareToken, navigate])

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

  const resolvedFormat = isIdeFormatSlug(query.data.templateId)
    ? query.data.templateId
    : format

  const seed: WorkspaceSessionSeed = {
    id: query.data.id,
    title: query.data.title,
    document: parseWorkspaceDocument(query.data.document),
    shareToken,
  }

  if (resolvedFormat === "shell") {
    return <ShellCollabSession key={seed.id} seed={seed} format={resolvedFormat} />
  }

  return (
    <EditorCollabSession
      key={seed.id}
      seed={seed}
      format={resolvedFormat}
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
}: {
  seed: WorkspaceSessionSeed
  format: Exclude<IdeFormatSlug, "shell">
}) {
  const { t } = useTranslation("simulation-ide")
  const { resolvedTheme } = useTheme()
  const preset = IDE_FORMAT_PRESETS[format]
  const session = useCollabWorkspaceSession(seed, {
    openSeedTabs: preset.openSeedTabs,
    defaultShowTree: preset.defaultShowTree,
  })
  const { settings, patchSettings, setSettings } = useIdeSettings()
  const pageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showTerminal, setShowTerminal] = useState(preset.defaultShowTerminal)
  const [showAi, setShowAi] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const { isOwner, canShare, isPaidOwner } = useCollabHeaderAccess(seed)

  const treeEnabled = preset.treeEnabled
  const tabsClosable = preset.tabsClosable

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
  const run = useBrowserRunActions({
    preset,
    activeTabId: session.activeTabId,
    getFilesSnapshot: session.getFilesSnapshot,
    setShowTerminal,
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

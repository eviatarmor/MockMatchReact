import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Loader2, Share2 } from "lucide-react"
import {
  IdeMenubar,
  IdeShell,
  useIdeSettings,
} from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { PresenceAvatarStack } from "@/features/collab/components/presence-avatar-stack"
import { RoomFullGate } from "@/features/collab/components/room-full-gate"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { useTheme } from "@/components/theme-provider"
import { AskChatSurface } from "@/features/ask/components/ask-chat-surface"
import { trpc } from "@/lib/trpc"
import { WORKSPACE_TABS, WORKSPACE_TREE } from "./constants"
import { useSimulationIdeSession } from "./hooks/use-simulation-ide-session"
import {
  parseWorkspaceDocument,
  documentFromTabs,
  useCollabWorkspaceSession,
  type WorkspaceSessionSeed,
} from "./hooks/use-collab-workspace-session"
import { isIdeFormatSlug } from "./types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function SimulationIdePageContent() {
  const { format: formatParam } = useParams<{ format: string }>()
  const navigate = useNavigate()

  const valid = isIdeFormatSlug(formatParam)

  useEffect(() => {
    if (!valid) {
      navigate("/simulations", { replace: true })
    }
  }, [valid, navigate])

  if (!valid) {
    return null
  }

  if (formatParam === "workspace") {
    return <WorkspaceCollabBootstrap />
  }

  return <SimulationIdeSession format={formatParam} />
}

/**
 * Ensure a durable workspace id for collab.
 * - `?id=` + optional `?share=` for join
 * - else create one and replace into URL
 */
function WorkspaceCollabBootstrap() {
  const { t } = useTranslation("simulation-ide")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const shareToken = searchParams.get("share")
  const isValidId = typeof idParam === "string" && UUID_RE.test(idParam)

  const create = trpc.ideWorkspaces.create.useMutation({
    onSuccess: (ws) => {
      navigate(`/simulations/ide/workspace?id=${ws.id}`, { replace: true })
    },
  })

  const createOnce = useRef(false)
  useEffect(() => {
    if (isValidId || shareToken) return
    if (createOnce.current || create.isPending || create.isSuccess) return
    createOnce.current = true
    create.mutate({
      title: t("formats.workspace.title"),
      document: documentFromTabs(WORKSPACE_TREE, WORKSPACE_TABS),
    })
  }, [isValidId, shareToken, create, t])

  // Share-only without id is invalid
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
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {create.isError ? t("collab.createError") : t("collab.preparing")}
      </div>
    )
  }

  return (
    <WorkspaceCollabLoader
      workspaceId={idParam}
      shareToken={shareToken}
    />
  )
}

function WorkspaceCollabLoader({
  workspaceId,
  shareToken,
}: {
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

  if (query.isLoading || (shareToken && access.isLoading)) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
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

  return <WorkspaceCollabSession key={seed.id} seed={seed} />
}

function WorkspaceCollabSession({
  seed,
}: {
  seed: WorkspaceSessionSeed
}) {
  const { t } = useTranslation("simulation-ide")
  const { resolvedTheme } = useTheme()
  const session = useCollabWorkspaceSession(seed)
  const { settings, patchSettings, setSettings } = useIdeSettings()
  const pageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showAi, setShowAi] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const access = trpc.collab.getAccess.useQuery(
    {
      kind: "workspace",
      id: seed.id,
      shareToken: seed.shareToken || undefined,
    },
    { staleTime: 30_000 }
  )
  const isOwner = access.data?.role === "owner"
  const canShare = Boolean(access.data?.canShare)
  const isPaidOwner = Boolean(
    access.data?.isPaidOwner ?? access.data?.isOwnerPaid
  )

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

  if (session.collab.status === "room_full") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={session.collab.roomError}
      />
    )
  }

  if (session.collab.status === "room_closed") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={session.collab.roomError}
        variant="closed"
      />
    )
  }

  return (
    <div ref={pageRef} className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <h1 className="shrink-0 text-sm font-medium text-foreground">
          {session.title || t("formats.workspace.title")}
        </h1>
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {t("formats.workspace.badge")}
        </Badge>
        <IdeMenubar
          className="min-w-0 flex-1"
          settings={settings}
          onPatchSettings={patchSettings}
          showTree={session.showTree}
          treeToggleable
          onToggleTree={() => session.setShowTree(!session.showTree)}
          showTerminal={showTerminal}
          onToggleTerminal={() => setShowTerminal((v) => !v)}
          showAi={showAi}
          onToggleAi={() => setShowAi((v) => !v)}
          fullscreen={fullscreen}
          onToggleFullscreen={() => void toggleFullscreen()}
          onCreateFile={() => session.requestCreate("file")}
          onCreateFolder={() => session.requestCreate("folder")}
          labels={labels}
        />
        <div className="flex shrink-0 items-center gap-2">
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
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <IdeShell
          className="h-full min-h-0"
          hideMenubar
          tree={session.tree}
          showTree={session.showTree}
          onShowTreeChange={session.setShowTree}
          treeToggleable
          selectedTreeId={session.selectedTreeId}
          onTreeSelectionChange={session.onTreeSelectionChange}
          onCreateFile={session.onCreateFile}
          onCreateFolder={session.onCreateFolder}
          onDeleteNode={session.onDeleteNode}
          onRenameNode={session.onRenameNode}
          createRequest={session.createRequest}
          onFilePreview={session.onFilePreview}
          onFileOpen={session.onFileOpen}
          tabs={session.tabs}
          activeTabId={session.activeTabId}
          onActiveTabChange={session.onActiveTabChange}
          onTabChange={session.onTabChange}
          onTabClose={session.onTabClose}
          colorScheme={resolvedTheme}
          settings={settings}
          onSettingsChange={setSettings}
          showTerminal={showTerminal}
          onShowTerminalChange={setShowTerminal}
          showAi={showAi}
          onShowAiChange={setShowAi}
          aiPanel={({ close }) => (
            <AskChatSurface onClose={close} showSuggestions={false} />
          )}
          labels={labels}
          collab={session.collabBag}
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
  )
}

/** Local-only code-run preview (no durable collab). */
function SimulationIdeSession({
  format,
}: {
  format: "code-run" | "workspace"
}) {
  const { t } = useTranslation("simulation-ide")
  const { resolvedTheme } = useTheme()
  const session = useSimulationIdeSession(format)
  const { settings, patchSettings, setSettings } = useIdeSettings()
  const pageRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [showTerminal, setShowTerminal] = useState(format === "workspace")
  const [showAi, setShowAi] = useState(false)

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

  const labels = useIdeLabels(t)

  return (
    <div ref={pageRef} className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <h1 className="shrink-0 text-sm font-medium text-foreground">
          {t(session.preset.titleKey)}
        </h1>
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {t(
            `formats.${session.preset.trackFormat === "codeRun" ? "codeRun" : "workspace"}.badge`
          )}
        </Badge>
        <IdeMenubar
          className="min-w-0"
          settings={settings}
          onPatchSettings={patchSettings}
          showTree={session.showTree}
          treeToggleable
          onToggleTree={() => session.setShowTree(!session.showTree)}
          showTerminal={showTerminal}
          onToggleTerminal={() => setShowTerminal((v) => !v)}
          showAi={showAi}
          onToggleAi={() => setShowAi((v) => !v)}
          fullscreen={fullscreen}
          onToggleFullscreen={() => void toggleFullscreen()}
          onCreateFile={() => session.requestCreate("file")}
          onCreateFolder={() => session.requestCreate("folder")}
          labels={labels}
        />
      </div>
      <div className="min-h-0 flex-1">
        <IdeShell
          className="h-full min-h-0"
          hideMenubar
          tree={session.tree}
          showTree={session.showTree}
          onShowTreeChange={session.setShowTree}
          treeToggleable
          selectedTreeId={session.selectedTreeId}
          onTreeSelectionChange={session.onTreeSelectionChange}
          defaultExpandedIds={session.defaultExpandedIds}
          onCreateFile={session.onCreateFile}
          onCreateFolder={session.onCreateFolder}
          onDeleteNode={session.onDeleteNode}
          onRenameNode={session.onRenameNode}
          onCopyNode={session.onCopyNode}
          onCutNode={session.onCutNode}
          onPasteNode={session.onPasteNode}
          onDuplicateNode={session.onDuplicateNode}
          canPaste={session.canPaste}
          createRequest={session.createRequest}
          onFilePreview={session.onFilePreview}
          onFileOpen={session.onFileOpen}
          tabs={session.tabs}
          activeTabId={session.activeTabId}
          onActiveTabChange={session.onActiveTabChange}
          onTabChange={session.onTabChange}
          onTabClose={session.onTabClose}
          onTabCloseOthers={session.onTabCloseOthers}
          onTabPin={session.onTabPin}
          onTabCopyPath={session.onTabCopyPath}
          onTabCopyRelativePath={session.onTabCopyRelativePath}
          onTabReveal={session.onTabReveal}
          colorScheme={resolvedTheme}
          settings={settings}
          onSettingsChange={setSettings}
          showTerminal={showTerminal}
          onShowTerminalChange={setShowTerminal}
          showAi={showAi}
          onShowAiChange={setShowAi}
          aiPanel={({ close }) => (
            <AskChatSurface onClose={close} showSuggestions={false} />
          )}
          labels={labels}
        />
      </div>
    </div>
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
  }
}

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  IdeMenubar,
  IdeShell,
  useIdeSettings,
} from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { useSimulationIdeSession } from "./hooks/use-simulation-ide-session"
import { isIdeFormatSlug } from "./types"

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

  return <SimulationIdeSession format={formatParam} />
}

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
      // blocked by browser
    }
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  // Workbench shortcuts (Ctrl+`, F11, Ctrl+W, …) live in IdeShell — do not double-bind here.

  const labels = {
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
          labels={labels}
        />
      </div>
    </div>
  )
}

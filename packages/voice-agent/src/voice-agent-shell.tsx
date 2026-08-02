import type { ReactNode } from "react"
import { RobotAgent } from "@mockmatch/ui/robot-agent"
import { Button } from "@mockmatch/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import { cn } from "@mockmatch/ui/utils"
import { AgentControls } from "./agent-controls"
import type {
  AgentControlsLabels,
  AgentPresenceState,
  SessionPhase,
} from "./types"

const AGENT_PANEL_DEFAULT = "34"
const CHAT_PANEL_DEFAULT = "66"
const AGENT_PANEL_MIN = "22"
const CHAT_PANEL_MIN = "40"

export type VoiceAgentShellProps = {
  /** Top chrome (typically IdeChromeBar + host menus). */
  readonly chrome: ReactNode
  /** Desktop left pane (agent stage). */
  readonly agentPanel: ReactNode
  /** Desktop right pane + mobile main (chat). */
  readonly chatPanel: ReactNode
  /** Mobile compact agent strip (between chrome and chat). */
  readonly mobileAgent?: {
    readonly agentState: AgentPresenceState
    readonly statusLabel: string
    readonly agentName: string
    readonly agentAriaLabel: string
    readonly phase: SessionPhase
    readonly muted: boolean
    readonly onMuteToggle: () => void
    readonly onEnd: () => void
    readonly controlsLabels: AgentControlsLabels
  }
  /** Optional footer under mobile chat (ended session actions). */
  readonly mobileFooter?: ReactNode
  readonly className?: string
}

/**
 * Product-agnostic live-agent layout: chrome + resizable agent|chat (desktop),
 * stacked agent strip + chat (mobile). Host owns session transport + chrome.
 */
export function VoiceAgentShell({
  chrome,
  agentPanel,
  chatPanel,
  mobileAgent,
  mobileFooter,
  className,
}: VoiceAgentShellProps) {
  return (
    <div
      className={cn("flex h-full min-h-0 flex-col bg-background", className)}
    >
      {chrome}

      <div className="hidden min-h-0 flex-1 lg:flex">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full"
          id="voice-agent-chat"
        >
          <ResizablePanel
            id="agent"
            defaultSize={AGENT_PANEL_DEFAULT}
            minSize={AGENT_PANEL_MIN}
            className="min-h-0 min-w-0"
          >
            {agentPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="chat"
            defaultSize={CHAT_PANEL_DEFAULT}
            minSize={CHAT_PANEL_MIN}
            className="min-h-0 min-w-0 border-l border-border"
          >
            {chatPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {mobileAgent ? (
          <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/20 px-3 py-2">
            <div className="flex items-center gap-3">
              <RobotAgent
                state={mobileAgent.agentState}
                size="sm"
                label={mobileAgent.agentAriaLabel}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {mobileAgent.agentName}
                </p>
                <p
                  className="text-2xs text-muted-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {mobileAgent.statusLabel}
                </p>
              </div>
            </div>
            <AgentControls
              phase={mobileAgent.phase}
              muted={mobileAgent.muted}
              onMuteToggle={mobileAgent.onMuteToggle}
              onEnd={mobileAgent.onEnd}
              labels={mobileAgent.controlsLabels}
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1">{chatPanel}</div>
        {mobileFooter}
      </div>
    </div>
  )
}

/** Convenience mobile end-session actions. */
export function VoiceAgentMobileEndedActions({
  restartLabel,
  backLabel,
  onRestart,
  onBack,
}: {
  readonly restartLabel: string
  readonly backLabel: string
  readonly onRestart: () => void
  readonly onBack: () => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-border p-3">
      <Button
        variant="default"
        className="h-8 cursor-pointer"
        onClick={onRestart}
      >
        {restartLabel}
      </Button>
      <Button
        variant="secondary"
        className="h-8 cursor-pointer"
        onClick={onBack}
      >
        {backLabel}
      </Button>
    </div>
  )
}

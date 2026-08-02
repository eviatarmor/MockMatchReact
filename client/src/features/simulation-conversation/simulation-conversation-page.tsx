import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { RobotAgent } from "@mockmatch/ui/robot-agent"
import { Button } from "@mockmatch/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import { INTERVIEW_TRACKS } from "@/features/simulations/constants"
import {
  DEFAULT_AGENT_VOICE,
  isConversationTrackId,
  type ConversationTrackId,
} from "./constants"
import { useMockConversationSession } from "./hooks/use-mock-conversation-session"
import { useVoiceSession } from "./hooks/use-voice-session"
import { ConversationSessionBar } from "./components/conversation-session-bar"
import { AgentControls } from "./components/agent-controls"
import { ChatPanel } from "./components/chat-panel"
import { SessionSetupDialog } from "./components/session-setup-dialog"
import type {
  AgentPresenceState,
  AgentVoiceId,
  ConversationSessionConfig,
  SessionPhase,
  TranscriptTurn,
} from "./types"

const AGENT_PANEL_DEFAULT = "34"
const CHAT_PANEL_DEFAULT = "66"
const AGENT_PANEL_MIN = "22"
const CHAT_PANEL_MIN = "40"

function ConversationSession({ trackId }: { readonly trackId: ConversationTrackId }) {
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-conversation", "common"])
  const [config, setConfig] = useState<ConversationSessionConfig | null>(null)
  const [setupOpen, setSetupOpen] = useState(true)
  const [inputKey, setInputKey] = useState(0)
  /** Once live voice connects, keep mock pipeline disabled for this run. */
  const [preferLive, setPreferLive] = useState(false)

  const ready = config !== null && !setupOpen
  const liveVoice = useVoiceSession()
  const liveActive =
    preferLive ||
    liveVoice.isLive ||
    liveVoice.status === "connecting" ||
    liveVoice.status === "creating"

  const session = useMockConversationSession(trackId, ready, !liveActive)
  const voice = config?.voice ?? DEFAULT_AGENT_VOICE

  const track = useMemo(
    () => INTERVIEW_TRACKS.find((item) => item.id === trackId),
    [trackId]
  )
  const title = track ? t(track.titleKey, { ns: "common" }) : trackId

  const agentState: AgentPresenceState = liveActive
    ? liveVoice.agentState
    : session.agentState

  const turns: readonly TranscriptTurn[] = liveActive
    ? liveVoice.turns
    : session.turns
  const liveTurnId = liveActive ? liveVoice.liveTurnId : session.liveTurnId
  const playbackTime = liveActive ? liveVoice.playbackTime : session.playbackTime

  const phase: SessionPhase =
    liveVoice.status === "ended"
      ? "ended"
      : session.phase === "setup"
        ? "setup"
        : liveVoice.status === "error"
          ? session.phase
          : session.phase

  const statusLabel =
    liveVoice.status === "error" && liveVoice.error
      ? liveVoice.error
      : liveVoice.status === "connecting" || liveVoice.status === "creating"
        ? t("simulation-conversation:status.joining")
        : liveActive
          ? t(`simulation-conversation:status.${agentState}`)
          : t(`simulation-conversation:status.${session.statusKey}`)

  const goSimulations = () => navigate("/simulations")

  const handleEnd = () => {
    void liveVoice.end()
    session.endSession()
  }

  const handleStart = async (next: ConversationSessionConfig) => {
    setConfig(next)
    setSetupOpen(false)
    setInputKey((k) => k + 1)
    // Prefer live immediately so mock script never fakes a "session"
    // (text-only transcript) while WebRTC is connecting or after a live error.
    setPreferLive(true)
    await liveVoice.start(trackId, next)
  }

  const handleRestart = () => {
    void liveVoice.end()
    setPreferLive(false)
    setConfig(null)
    setSetupOpen(true)
    session.restart()
    setInputKey((k) => k + 1)
  }

  const handleVoiceChange = (next: AgentVoiceId) => {
    setConfig((prev) => (prev ? { ...prev, voice: next } : prev))
  }

  const canSend = liveActive ? false : session.canSend
  const isBusy = liveActive ? liveVoice.isBusy : session.busy
  const phaseEnded =
    phase === "ended" ||
    phase === "setup" ||
    liveVoice.status === "ended"

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SessionSetupDialog
        open={setupOpen}
        trackTitle={title}
        onCancel={goSimulations}
        onStart={handleStart}
      />

      <ConversationSessionBar
        title={title}
        phase={phase}
        muted={liveActive ? liveVoice.muted : session.muted}
        voice={voice}
        onMuteToggle={
          liveActive ? liveVoice.toggleMute : session.toggleMute
        }
        onVoiceChange={handleVoiceChange}
        onEnd={handleEnd}
        onRestart={handleRestart}
        onBack={goSimulations}
      />

      <div className="hidden min-h-0 flex-1 lg:flex">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full"
          id="conversation-chat"
        >
          <ResizablePanel
            id="agent"
            defaultSize={AGENT_PANEL_DEFAULT}
            minSize={AGENT_PANEL_MIN}
            className="min-h-0 min-w-0"
          >
            <AgentStage
              agentState={agentState}
              statusLabel={statusLabel}
              phase={phase}
              muted={liveActive ? liveVoice.muted : session.muted}
              phaseEnded={phaseEnded}
              onMuteToggle={
                liveActive ? liveVoice.toggleMute : session.toggleMute
              }
              onEnd={handleEnd}
              onRestart={handleRestart}
              onBack={goSimulations}
              onOpenSetup={() => setSetupOpen(true)}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            id="chat"
            defaultSize={CHAT_PANEL_DEFAULT}
            minSize={CHAT_PANEL_MIN}
            className="min-h-0 min-w-0 border-l border-border"
          >
            <ChatPanel
              turns={turns}
              liveTurnId={liveTurnId}
              playbackTime={playbackTime}
              canSend={canSend}
              isBusy={isBusy}
              phaseEnded={phaseEnded}
              inputResetKey={`${trackId}-${inputKey}`}
              onSend={session.sendMessage}
              onListeningChange={session.setListening}
              className="h-full border-0"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex shrink-0 flex-col gap-2 border-b border-border bg-muted/20 px-3 py-2">
          <div className="flex items-center gap-3">
            <RobotAgent
              state={agentState}
              size="sm"
              label={t("simulation-conversation:agent.label", {
                state: statusLabel,
              })}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">
                {t("simulation-conversation:agent.name")}
              </p>
              <p
                className="text-2xs text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                {statusLabel}
              </p>
            </div>
          </div>
          <AgentControls
            phase={phase}
            muted={liveActive ? liveVoice.muted : session.muted}
            onMuteToggle={
              liveActive ? liveVoice.toggleMute : session.toggleMute
            }
            onEnd={handleEnd}
          />
        </div>
        <ChatPanel
          turns={turns}
          liveTurnId={liveTurnId}
          playbackTime={playbackTime}
          canSend={canSend}
          isBusy={isBusy}
          phaseEnded={phaseEnded}
          inputResetKey={`${trackId}-${inputKey}`}
          onSend={session.sendMessage}
          onListeningChange={session.setListening}
          className="min-h-0 flex-1 border-0"
        />
        {phaseEnded && phase !== "setup" ? (
          <div className="flex shrink-0 flex-wrap justify-center gap-2 border-t border-border p-3">
            <Button
              variant="default"
              className="h-8 cursor-pointer"
              onClick={handleRestart}
            >
              {t("simulation-conversation:controls.restart")}
            </Button>
            <Button
              variant="secondary"
              className="h-8 cursor-pointer"
              onClick={goSimulations}
            >
              {t("simulation-conversation:controls.backToSimulations")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AgentStage({
  agentState,
  statusLabel,
  phase,
  muted,
  phaseEnded,
  onMuteToggle,
  onEnd,
  onRestart,
  onBack,
  onOpenSetup,
}: {
  readonly agentState: AgentPresenceState
  readonly statusLabel: string
  readonly phase: SessionPhase
  readonly muted: boolean
  readonly phaseEnded: boolean
  readonly onMuteToggle: () => void
  readonly onEnd: () => void
  readonly onRestart: () => void
  readonly onBack: () => void
  readonly onOpenSetup: () => void
}) {
  const { t } = useTranslation("simulation-conversation")

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 bg-muted/20 px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <RobotAgent
          state={agentState}
          size="xl"
          label={t("agent.label", { state: statusLabel })}
        />
        <div className="text-center">
          <p className="text-sm font-medium">{t("agent.name")}</p>
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {statusLabel}
          </p>
        </div>
      </div>

      {phase === "setup" ? (
        <div className="flex flex-col items-center gap-2">
          <p className="max-w-[16rem] text-center text-xs text-muted-foreground">
            {t("setup.waitingHint")}
          </p>
          <Button
            variant="default"
            className="h-8 cursor-pointer"
            onClick={onOpenSetup}
          >
            {t("setup.openAgain")}
          </Button>
        </div>
      ) : phaseEnded ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="default"
            className="h-8 cursor-pointer"
            onClick={onRestart}
          >
            {t("controls.restart")}
          </Button>
          <Button
            variant="secondary"
            className="h-8 cursor-pointer"
            onClick={onBack}
          >
            {t("controls.backToSimulations")}
          </Button>
        </div>
      ) : (
        <>
          <AgentControls
            phase={phase}
            muted={muted}
            onMuteToggle={onMuteToggle}
            onEnd={onEnd}
          />
          <p className="max-w-[16rem] text-center text-xs text-muted-foreground">
            {t("hint")}
          </p>
        </>
      )}
    </div>
  )
}

export function SimulationConversationPageContent() {
  const { trackId: trackParam } = useParams<{ trackId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation("simulation-conversation")

  if (!isConversationTrackId(trackParam)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6">
        <p className="text-sm text-muted-foreground">
          {t("errors.unknownTrack")}
        </p>
        <Button
          variant="secondary"
          className="h-8 cursor-pointer"
          onClick={() => navigate("/simulations/tracks")}
        >
          {t("errors.backToTracks")}
        </Button>
      </div>
    )
  }

  return <ConversationSession trackId={trackParam} />
}

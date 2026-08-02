import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@mockmatch/ui/button"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import {
  AgentStage,
  VoiceAgentMobileEndedActions,
  VoiceAgentShell,
  type AgentPresenceState,
  type SessionPhase,
  type TranscriptTurn,
} from "@mockmatch/voice-agent"
import { INTERVIEW_TRACKS } from "@/features/simulations/constants"
import { trpc } from "@/lib/trpc"
import {
  DEFAULT_AGENT_VOICE,
  isConversationTrackId,
  type ConversationTrackId,
} from "./constants"
import { useMockConversationSession } from "./hooks/use-mock-conversation-session"
import { useVoiceSession } from "./hooks/use-voice-session"
import { ConversationSessionBar } from "./components/conversation-session-bar"
import { ChatPanel } from "./components/chat-panel"
import { SessionSetupDialog } from "./components/session-setup-dialog"
import type {
  AgentVoiceId,
  ConversationSessionConfig,
} from "./types"

/** Accept any standard UUID shape (not only RFC version 1–5). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function ConversationSession({
  trackId,
  questionId,
  questionTitle,
}: {
  readonly trackId: ConversationTrackId
  /** Bank question UUID — seeds interviewer prompt; also used as URL identity. */
  readonly questionId?: string
  readonly questionTitle?: string | null
}) {
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
  const title =
    questionTitle?.trim() ||
    (track ? t(track.titleKey, { ns: "common" }) : trackId)

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
    await liveVoice.start(trackId, next, { questionId })
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

  const muted = liveActive ? liveVoice.muted : session.muted
  const onMuteToggle = liveActive ? liveVoice.toggleMute : session.toggleMute
  const controlsLabels = {
    mute: t("simulation-conversation:controls.mute"),
    unmute: t("simulation-conversation:controls.unmute"),
    endSession: t("simulation-conversation:controls.endSession"),
  }

  return (
    <>
      <SessionSetupDialog
        open={setupOpen}
        trackTitle={title}
        onCancel={goSimulations}
        onStart={handleStart}
      />

      <VoiceAgentShell
        chrome={
          <ConversationSessionBar
            title={title}
            phase={phase}
            muted={muted}
            voice={voice}
            onMuteToggle={onMuteToggle}
            onVoiceChange={handleVoiceChange}
            onEnd={handleEnd}
            onRestart={handleRestart}
            onBack={goSimulations}
          />
        }
        agentPanel={
          <AgentStage
            agentState={agentState}
            statusLabel={statusLabel}
            phase={phase}
            muted={muted}
            phaseEnded={phaseEnded}
            onMuteToggle={onMuteToggle}
            onEnd={handleEnd}
            onRestart={handleRestart}
            onBack={goSimulations}
            onOpenSetup={() => setSetupOpen(true)}
            labels={{
              agentName: t("simulation-conversation:agent.name"),
              agentLabel: (state) =>
                t("simulation-conversation:agent.label", { state }),
              waitingHint: t("simulation-conversation:setup.waitingHint"),
              openSetup: t("simulation-conversation:setup.openAgain"),
              restart: t("simulation-conversation:controls.restart"),
              back: t("simulation-conversation:controls.backToSimulations"),
              hint: t("simulation-conversation:hint"),
              controls: controlsLabels,
            }}
          />
        }
        chatPanel={
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
        }
        mobileAgent={{
          agentState,
          statusLabel,
          agentName: t("simulation-conversation:agent.name"),
          agentAriaLabel: t("simulation-conversation:agent.label", {
            state: statusLabel,
          }),
          phase,
          muted,
          onMuteToggle,
          onEnd: handleEnd,
          controlsLabels,
        }}
        mobileFooter={
          phaseEnded && phase !== "setup" ? (
            <VoiceAgentMobileEndedActions
              restartLabel={t("simulation-conversation:controls.restart")}
              backLabel={t(
                "simulation-conversation:controls.backToSimulations"
              )}
              onRestart={handleRestart}
              onBack={goSimulations}
            />
          ) : null
        }
      />
    </>
  )
}

export function SimulationConversationPageContent() {
  const { trackId: trackParam } = useParams<{ trackId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation("simulation-conversation")

  // Prefer explicit ?questionId= (legacy links) or UUID in path segment
  const queryQuestionId = searchParams.get("questionId")
  const pathIsUuid = Boolean(trackParam && UUID_RE.test(trackParam))
  const bankQuestionId =
    queryQuestionId && UUID_RE.test(queryQuestionId)
      ? queryQuestionId
      : pathIsUuid
        ? trackParam!
        : null

  const questionQuery = trpc.questions.get.useQuery(
    { id: bankQuestionId! },
    {
      enabled: Boolean(bankQuestionId),
      retry: false,
      staleTime: 60_000,
    }
  )

  // Canonicalize legacy URLs → /conversation/:questionId only
  useEffect(() => {
    if (!bankQuestionId) return
    if (trackParam === bankQuestionId && !searchParams.has("questionId")) return
    navigate(`/simulations/conversation/${bankQuestionId}`, { replace: true })
  }, [bankQuestionId, trackParam, searchParams, navigate])

  // Bank question practice (path = UUID and/or ?questionId=)
  if (bankQuestionId) {
    if (questionQuery.isLoading || questionQuery.isFetching) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground">
          <RobotLoader
            size="md"
            label={t("errors.loading", { defaultValue: "Loading…" })}
          />
        </div>
      )
    }

    if (questionQuery.isError || !questionQuery.data) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6">
          <p className="text-sm text-muted-foreground">
            {t("errors.questionNotFound", {
              defaultValue: "That practice question was not found.",
            })}
          </p>
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            {questionQuery.error?.message}
          </p>
          <Button
            variant="secondary"
            className="h-8 cursor-pointer"
            onClick={() => navigate("/question-bank")}
          >
            {t("errors.backToQuestionBank", {
              defaultValue: "Back to question bank",
            })}
          </Button>
        </div>
      )
    }

    const q = questionQuery.data
    if (q.format === "mcq") {
      navigate(`/simulations/mcq/${q.id}`, { replace: true })
      return null
    }
    if (q.format !== "conversation") {
      navigate(`/simulations/practice/${q.id}`, { replace: true })
      return null
    }

    const trackId: ConversationTrackId =
      q.conversationTrackId && isConversationTrackId(q.conversationTrackId)
        ? q.conversationTrackId
        : "behavioral-core"

    return (
      <ConversationSession
        trackId={trackId}
        questionId={q.id}
        questionTitle={q.title}
      />
    )
  }

  // Catalog tracks only (behavioral-core, product-sense, system-design-talk)
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

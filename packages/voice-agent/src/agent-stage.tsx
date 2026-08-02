import { RobotAgent } from "@mockmatch/ui/robot-agent"
import { Button } from "@mockmatch/ui/button"
import { AgentControls } from "./agent-controls"
import type {
  AgentPresenceState,
  AgentStageLabels,
  SessionPhase,
} from "./types"

export type AgentStageProps = {
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
  readonly labels: AgentStageLabels
}

export function AgentStage({
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
  labels,
}: AgentStageProps) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 bg-muted/20 px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <RobotAgent
          state={agentState}
          size="xl"
          label={labels.agentLabel(statusLabel)}
        />
        <div className="text-center">
          <p className="text-sm font-medium">{labels.agentName}</p>
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
            {labels.waitingHint}
          </p>
          <Button
            variant="default"
            className="h-8 cursor-pointer"
            onClick={onOpenSetup}
          >
            {labels.openSetup}
          </Button>
        </div>
      ) : phaseEnded ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="default"
            className="h-8 cursor-pointer"
            onClick={onRestart}
          >
            {labels.restart}
          </Button>
          <Button
            variant="secondary"
            className="h-8 cursor-pointer"
            onClick={onBack}
          >
            {labels.back}
          </Button>
        </div>
      ) : (
        <>
          <AgentControls
            phase={phase}
            muted={muted}
            onMuteToggle={onMuteToggle}
            onEnd={onEnd}
            labels={labels.controls}
          />
          <p className="max-w-[16rem] text-center text-xs text-muted-foreground">
            {labels.hint}
          </p>
        </>
      )}
    </div>
  )
}

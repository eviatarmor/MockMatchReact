import type { RobotAgentState } from "@mockmatch/ui/robot-agent"

export type AgentPresenceState = RobotAgentState

export type TranscriptRole = "agent" | "user" | "system"

/** Word-level segment compatible with `@mockmatch/ai-chat` Transcription. */
export interface TranscriptSegment {
  readonly text: string
  readonly startSecond: number
  readonly endSecond: number
}

export interface TranscriptTurn {
  readonly id: string
  readonly role: TranscriptRole
  readonly text: string
  readonly at: number
  readonly segments: readonly TranscriptSegment[]
  readonly durationSec: number
}

export type SessionPhase = "setup" | "joining" | "active" | "ended"

export type AgentControlsLabels = {
  mute: string
  unmute: string
  endSession: string
}

export type ConversationInputLabels = {
  placeholder: string
  placeholderListening: string
  startListening: string
  stopListening: string
  send: string
  stop: string
}

export type ChatPanelLabels = {
  title: string
  empty: string
  roleAgent: string
  roleUser: string
  roleSystem: string
  input: ConversationInputLabels
}

export type AgentStageLabels = {
  agentName: string
  agentLabel: (status: string) => string
  waitingHint: string
  openSetup: string
  restart: string
  back: string
  hint: string
  controls: AgentControlsLabels
}

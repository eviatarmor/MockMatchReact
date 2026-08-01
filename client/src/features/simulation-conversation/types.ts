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

export type SessionKind = "practice" | "fullInterview" | "freeform"

export interface MockConversationScript {
  readonly trackId: string
  /** Agent lines in order after each user “reply”. First is the greeting. */
  readonly agentLines: readonly string[]
  /** Placeholder user lines when the user “speaks” (mock STT). */
  readonly userLines: readonly string[]
}

export type AgentVoiceId =
  | "buttery"
  | "resonant"
  | "mellow"
  | "airy"
  | "polished"
  | "rounded"

/** Config chosen in the pre-session setup dialog. */
export interface ConversationSessionConfig {
  readonly sessionKind: SessionKind
  readonly analyzeFace: boolean
  readonly analyzePosture: boolean
  readonly voice: AgentVoiceId
  readonly microphoneId: string | undefined
}

export interface VoiceCatalogEntry {
  readonly id: AgentVoiceId
  readonly gender: "male" | "female"
  readonly accent: "american" | "british" | "australian"
}

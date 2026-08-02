export type {
  AgentPresenceState,
  TranscriptRole,
  TranscriptSegment,
  TranscriptTurn,
  SessionPhase,
} from "@mockmatch/voice-agent"

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
  /** Deepgram Aura-2 TTS model id (e.g. aura-2-helena-en). */
  readonly deepgramModel: string
  readonly gender: "male" | "female"
  readonly accent: "american" | "british" | "australian"
}

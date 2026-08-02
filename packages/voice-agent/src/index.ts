/**
 * Product-agnostic live voice-agent shell.
 * Host supplies transport (WebRTC/Pipecat), chrome, and labels.
 */

export { AgentControls, type AgentControlsProps } from "./agent-controls"
export { AgentStage, type AgentStageProps } from "./agent-stage"
export { ChatPanel, type ChatPanelProps } from "./chat-panel"
export {
  ConversationInput,
  type ConversationInputProps,
} from "./conversation-input"
export {
  VoiceAgentShell,
  VoiceAgentMobileEndedActions,
  type VoiceAgentShellProps,
} from "./voice-agent-shell"
export { textToSegments } from "./lib/text-to-segments"
export type {
  AgentPresenceState,
  AgentControlsLabels,
  AgentStageLabels,
  ChatPanelLabels,
  ConversationInputLabels,
  SessionPhase,
  TranscriptRole,
  TranscriptSegment,
  TranscriptTurn,
} from "./types"

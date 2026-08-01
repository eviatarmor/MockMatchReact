import { idePathForTrackId } from "@/features/simulation-ide/constants"
import { INTERVIEW_TRACKS } from "../constants"

export const CONVERSATION_BASE_PATH = "/simulations/conversation"

/** App path for a conversation track session. */
export function conversationPathForTrackId(trackId: string): string {
  return `${CONVERSATION_BASE_PATH}/${trackId}`
}

/**
 * Catalog track id → practice path (IDE formats + conversation).
 */
export function practicePathForTrackId(trackId: string): string | null {
  const track = INTERVIEW_TRACKS.find((t) => t.id === trackId)
  if (track?.format === "conversation") {
    return conversationPathForTrackId(trackId)
  }
  return idePathForTrackId(trackId)
}

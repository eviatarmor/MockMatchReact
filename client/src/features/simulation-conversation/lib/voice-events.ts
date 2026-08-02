export type VoiceAgentState =
  | "asleep"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"

export type VoiceSessionStatus = "ready" | "live" | "ended" | "error"

export type VoiceUiEvent =
  | { type: "agent_state"; state: VoiceAgentState }
  | {
      type: "transcript"
      role: "user" | "agent" | "system"
      text: string
      final: boolean
      id?: string
    }
  | { type: "session_status"; status: VoiceSessionStatus }

function isAgentState(state: string): state is VoiceAgentState {
  return (
    state === "asleep" ||
    state === "idle" ||
    state === "listening" ||
    state === "thinking" ||
    state === "speaking"
  )
}

function isSessionStatus(status: string): status is VoiceSessionStatus {
  return (
    status === "ready" ||
    status === "live" ||
    status === "ended" ||
    status === "error"
  )
}

export function parseVoiceEvent(raw: unknown): VoiceUiEvent | null {
  if (!raw || typeof raw !== "object") return null
  const event = raw as Record<string, unknown>

  if (event.type === "agent_state" && typeof event.state === "string") {
    if (isAgentState(event.state)) {
      return { type: "agent_state", state: event.state }
    }
    if (event.state === "ready" || event.state === "speakingMuted") {
      return { type: "agent_state", state: "idle" }
    }
    return null
  }

  if (event.type === "transcript" && typeof event.text === "string") {
    const role =
      event.role === "user" ||
      event.role === "agent" ||
      event.role === "system"
        ? event.role
        : "system"
    return {
      type: "transcript",
      role,
      text: event.text,
      final: event.final !== false,
      id: typeof event.id === "string" ? event.id : undefined,
    }
  }

  if (
    event.type === "session_status" &&
    typeof event.status === "string" &&
    isSessionStatus(event.status)
  ) {
    return { type: "session_status", status: event.status }
  }

  return null
}

export function parseSseBlock(block: string): unknown | null {
  if (block.includes("event: ping")) return null
  const dataLine = block.split("\n").find((line) => line.startsWith("data:"))
  if (!dataLine) return null

  const raw = dataLine.slice(5).trim()
  if (!raw || raw === "{}") return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

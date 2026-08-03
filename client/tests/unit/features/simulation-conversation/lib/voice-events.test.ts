import { describe, expect, it } from "vitest"
import { parseSseBlock, parseVoiceEvent } from "@/features/simulation-conversation/lib/voice-events"

describe("parseVoiceEvent", () => {
  it("parses live session and agent presence events", () => {
    expect(parseVoiceEvent({ type: "session_status", status: "live" })).toEqual({
      type: "session_status",
      status: "live",
    })
    expect(
      parseVoiceEvent({ type: "agent_state", state: "listening" })
    ).toEqual({ type: "agent_state", state: "listening" })
    expect(parseVoiceEvent({ type: "agent_state", state: "ready" })).toEqual({
      type: "agent_state",
      state: "idle",
    })
  })

  it("rejects unknown statuses", () => {
    expect(
      parseVoiceEvent({ type: "session_status", status: "unexpected" })
    ).toBeNull()
    expect(
      parseVoiceEvent({ type: "agent_state", state: "unexpected" })
    ).toBeNull()
  })

  it("parses transcript", () => {
    expect(
      parseVoiceEvent({
        type: "transcript",
        role: "user",
        text: "hi",
        final: true,
      })
    ).toEqual({
      type: "transcript",
      role: "user",
      text: "hi",
      final: true,
      id: undefined,
    })
  })
})

describe("parseSseBlock", () => {
  it("parses voice payloads and ignores keepalives", () => {
    expect(
      parseSseBlock(
        'event: voice\ndata: {"type":"agent_state","state":"speaking"}'
      )
    ).toEqual({ type: "agent_state", state: "speaking" })
    expect(parseSseBlock("event: ping\ndata: {}")).toBeNull()
    expect(parseSseBlock("event: voice\ndata: not-json")).toBeNull()
  })
})

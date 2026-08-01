import assert from "node:assert/strict"
import test from "node:test"
import { parseSseBlock, parseVoiceEvent } from "./voice-events.ts"

test("parses live session and agent presence events", () => {
  assert.deepEqual(parseVoiceEvent({ type: "session_status", status: "live" }), {
    type: "session_status",
    status: "live",
  })
  assert.deepEqual(
    parseVoiceEvent({ type: "agent_state", state: "listening" }),
    { type: "agent_state", state: "listening" }
  )
  assert.deepEqual(parseVoiceEvent({ type: "agent_state", state: "ready" }), {
    type: "agent_state",
    state: "idle",
  })
})

test("rejects unknown statuses instead of masking them as ready", () => {
  assert.equal(
    parseVoiceEvent({ type: "session_status", status: "unexpected" }),
    null
  )
  assert.equal(
    parseVoiceEvent({ type: "agent_state", state: "unexpected" }),
    null
  )
})

test("parses SSE voice payloads and ignores keepalives", () => {
  assert.deepEqual(
    parseSseBlock(
      'event: voice\ndata: {"type":"agent_state","state":"speaking"}'
    ),
    { type: "agent_state", state: "speaking" }
  )
  assert.equal(parseSseBlock("event: ping\ndata: {}"), null)
  assert.equal(parseSseBlock("event: voice\ndata: not-json"), null)
})

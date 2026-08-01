import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  AgentPresenceState,
  SessionPhase,
  TranscriptTurn,
} from "../types"
import {
  JOIN_DELAY_MS,
  MOCK_SCRIPTS,
  THINKING_MS,
  type ConversationTrackId,
} from "../constants"
import { textToSegments } from "../lib/transcript-segments"

function turnId() {
  return `t-${Math.random().toString(36).slice(2, 10)}`
}

const FALLBACK_AGENT_LINES = [
  "Thanks — tell me more about that.",
  "Interesting. What would you do differently next time?",
  "Got it. How did stakeholders react?",
  "Solid point. What’s the trade-off you’re most worried about?",
  "Okay. Walk me through how you’d measure success.",
] as const

/**
 * Client-only conversation: greeting, then wait for user text/voice turns.
 * Streams agent replies with word-level segments. No backend.
 * Pass `ready=true` after the setup dialog so the session can join.
 */
export function useMockConversationSession(
  trackId: ConversationTrackId,
  ready: boolean
) {
  const script = MOCK_SCRIPTS[trackId]
  const [phase, setPhase] = useState<SessionPhase>("setup")
  const [agentState, setAgentState] = useState<AgentPresenceState>("asleep")
  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [liveTurnId, setLiveTurnId] = useState<string | null>(null)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [sessionKey, setSessionKey] = useState(0)
  const [muted, setMuted] = useState(false)
  const [busy, setBusy] = useState(false)

  const timers = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const phaseRef = useRef(phase)
  const busyRef = useRef(false)
  const agentLineRef = useRef(1)
  const fallbackRef = useRef(0)
  phaseRef.current = phase
  busyRef.current = busy

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
    return id
  }, [])

  const stopPlayback = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setLiveTurnId(null)
    setPlaybackTime(0)
  }, [])

  const playTurn = useCallback(
    (role: TranscriptTurn["role"], text: string, onDone: () => void) => {
      const { segments, durationSec } = textToSegments(text)
      const id = turnId()
      setTurns((prev) => [
        ...prev,
        {
          id,
          role,
          text,
          at: Date.now(),
          segments,
          durationSec,
        },
      ])
      setLiveTurnId(id)
      setPlaybackTime(0)

      const started = performance.now()
      const durationMs = Math.max(400, durationSec * 1000)
      let finished = false

      const finish = () => {
        if (finished || phaseRef.current === "ended") return
        finished = true
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        setPlaybackTime(durationSec)
        setLiveTurnId(null)
        onDone()
      }

      const tick = (now: number) => {
        if (finished || phaseRef.current === "ended") return
        const elapsed = (now - started) / 1000
        setPlaybackTime(elapsed)
        if (elapsed >= durationSec) {
          finish()
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
      schedule(finish, durationMs + 80)
    },
    [schedule]
  )

  const pushInstantTurn = useCallback(
    (role: TranscriptTurn["role"], text: string) => {
      const { segments, durationSec } = textToSegments(text)
      setTurns((prev) => [
        ...prev,
        {
          id: turnId(),
          role,
          text,
          at: Date.now(),
          segments,
          durationSec,
        },
      ])
      setLiveTurnId(null)
      setPlaybackTime(durationSec)
    },
    []
  )

  const nextAgentLine = useCallback(() => {
    const scripted = script.agentLines[agentLineRef.current]
    if (scripted) {
      agentLineRef.current += 1
      return scripted
    }
    const line =
      FALLBACK_AGENT_LINES[fallbackRef.current % FALLBACK_AGENT_LINES.length]!
    fallbackRef.current += 1
    return line
  }, [script])

  // Wait for setup dialog, then join → greeting → idle
  useEffect(() => {
    clearTimers()
    stopPlayback()
    setTurns([])
    setBusy(false)
    busyRef.current = false
    agentLineRef.current = 1
    fallbackRef.current = 0
    setAgentState("asleep")

    if (!ready) {
      setPhase("setup")
      return clearTimers
    }

    setPhase("joining")
    schedule(() => {
      setPhase("active")
      const greeting = script.agentLines[0]
      if (!greeting) {
        setAgentState("idle")
        return
      }
      setBusy(true)
      busyRef.current = true
      setAgentState("speaking")
      playTurn("agent", greeting, () => {
        if (phaseRef.current !== "active") return
        setAgentState("idle")
        setBusy(false)
        busyRef.current = false
      })
    }, JOIN_DELAY_MS)

    return clearTimers
  }, [
    trackId,
    sessionKey,
    ready,
    script,
    clearTimers,
    schedule,
    playTurn,
    stopPlayback,
  ])

  const setListening = useCallback((listening: boolean) => {
    if (phaseRef.current !== "active" || busyRef.current) return
    setAgentState(listening ? "listening" : "idle")
  }, [])

  const sendMessage = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text || phaseRef.current !== "active" || busyRef.current) return false

      setBusy(true)
      busyRef.current = true
      // User message appears fully (chat send); agent streams next.
      pushInstantTurn("user", text)
      setAgentState("thinking")

      schedule(() => {
        if (phaseRef.current !== "active") return
        const agentText = nextAgentLine()
        setAgentState("speaking")
        playTurn("agent", agentText, () => {
          if (phaseRef.current !== "active") return
          setAgentState("idle")
          setBusy(false)
          busyRef.current = false
        })
      }, THINKING_MS)

      return true
    },
    [pushInstantTurn, schedule, playTurn, nextAgentLine]
  )

  const restart = useCallback(() => {
    setSessionKey((k) => k + 1)
  }, [])

  const endSession = useCallback(() => {
    clearTimers()
    stopPlayback()
    setPhase("ended")
    setAgentState("asleep")
    setBusy(false)
    busyRef.current = false
    pushInstantTurn("system", "Session ended.")
  }, [clearTimers, stopPlayback, pushInstantTurn])

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const statusKey = useMemo(() => {
    if (phase === "setup") return "setup" as const
    if (phase === "joining") return "joining" as const
    if (phase === "ended") return "ended" as const
    if (muted && agentState === "speaking") return "speakingMuted" as const
    return agentState
  }, [phase, agentState, muted])

  const displayAgentState: AgentPresenceState =
    muted && agentState === "speaking" ? "idle" : agentState

  return {
    phase,
    agentState: displayAgentState,
    turns,
    liveTurnId,
    playbackTime,
    statusKey,
    muted,
    busy,
    canSend: phase === "active" && !busy,
    toggleMute,
    setListening,
    sendMessage,
    endSession,
    restart,
  }
}

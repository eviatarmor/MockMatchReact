import { useCallback, useEffect, useRef, useState } from "react"
import { trpc } from "@/lib/trpc"
import { connectVoiceSession } from "../lib/webrtc-offer"
import { textToSegments } from "../lib/transcript-segments"
import { parseSseBlock, parseVoiceEvent } from "../lib/voice-events"
import type {
  AgentPresenceState,
  ConversationSessionConfig,
  TranscriptTurn,
} from "../types"

export type VoiceConnectionStatus =
  | "idle"
  | "creating"
  | "connecting"
  | "live"
  | "error"
  | "ended"

function turnFromEvent(
  role: TranscriptTurn["role"],
  text: string,
  id?: string
): TranscriptTurn {
  const { segments, durationSec } = textToSegments(text)
  return {
    id: id ?? `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    text,
    at: Date.now(),
    segments,
    durationSec,
  }
}

function creationErrorMessage(result: {
  message?: unknown
  code?: unknown
}): string {
  if (result.message) return String(result.message)
  if (result.code) return String(result.code)
  return "Failed to create voice session"
}

async function getVoiceStream(
  microphoneId: string | undefined
): Promise<MediaStream> {
  const audio: MediaTrackConstraints = microphoneId
    ? {
        deviceId: { ideal: microphoneId },
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
      }
    : {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
      }

  try {
    return await navigator.mediaDevices.getUserMedia({ audio, video: false })
  } catch {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  }
}

/**
 * Create API session + open WebRTC to Pipecat voice worker.
 * UI events from SSE (primary) + WebRTC data channel (fallback).
 */
export function useVoiceSession() {
  const createMut = trpc.voice.createSession.useMutation()
  const endMut = trpc.voice.endSession.useMutation()
  const [status, setStatus] = useState<VoiceConnectionStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agentState, setAgentState] = useState<AgentPresenceState>("asleep")
  const [turns, setTurns] = useState<TranscriptTurn[]>([])
  const [liveTurnId, setLiveTurnId] = useState<string | null>(null)
  const [playbackTime, setPlaybackTime] = useState(0)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localRef = useRef<MediaStream | null>(null)
  const micTrackRef = useRef<MediaStreamTrack | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const endingRef = useRef(false)
  const attemptRef = useRef(0)
  const sessionIdRef = useRef<string | null>(null)
  /** Sticky speaking: bridge TTS chunk gaps + ignore VAD-while-talking. */
  const agentStateRef = useRef<AgentPresenceState>("asleep")
  const speakHoldTimerRef = useRef<number | null>(null)
  const [micMuted, setMicMuted] = useState(false)

  const clearSpeakHold = useCallback(() => {
    if (speakHoldTimerRef.current != null) {
      window.clearTimeout(speakHoldTimerRef.current)
      speakHoldTimerRef.current = null
    }
  }, [])

  const applyAgentPresence = useCallback(
    (next: AgentPresenceState) => {
      const current = agentStateRef.current

      // Keep mouth moving while audio is still out — drop listening/thinking
      // (often echo from the speaker into the mic).
      if (
        current === "speaking" &&
        (next === "listening" || next === "thinking")
      ) {
        return
      }

      // Debounce speaking → idle so brief TTSStopped gaps don't freeze the face.
      if (current === "speaking" && next === "idle") {
        clearSpeakHold()
        speakHoldTimerRef.current = window.setTimeout(() => {
          speakHoldTimerRef.current = null
          if (agentStateRef.current !== "speaking") return
          agentStateRef.current = "idle"
          setAgentState("idle")
        }, 450)
        return
      }

      clearSpeakHold()
      agentStateRef.current = next
      setAgentState(next)
    },
    [clearSpeakHold]
  )

  const applyEvent = useCallback(
    (raw: unknown) => {
    const ev = parseVoiceEvent(raw)
    if (!ev) return

    if (ev.type === "agent_state") {
      applyAgentPresence(ev.state)
      return
    }
    if (ev.type === "session_status") {
      if (ev.status === "live") {
        setStatus("live")
        applyAgentPresence(
          agentStateRef.current === "asleep" ? "idle" : agentStateRef.current
        )
        return
      }
      if (ev.status === "ended" || ev.status === "error") {
        setStatus(ev.status === "error" ? "error" : "ended")
        clearSpeakHold()
        agentStateRef.current = "asleep"
        setAgentState("asleep")
        sessionIdRef.current = null
      }
      return
    }
    if (ev.type === "transcript") {
      if (!ev.final) {
        const id = ev.id ?? "interim-user"
        setLiveTurnId(id)
        setTurns((prev) => {
          const without = prev.filter((t) => t.id !== id)
          return [...without, turnFromEvent(ev.role, ev.text, id)]
        })
        setPlaybackTime(0)
        return
      }
      const turn = turnFromEvent(ev.role, ev.text, ev.id)
      setTurns((prev) => {
        const withoutInterim = prev.filter((t) => t.id !== "interim-user")
        if (withoutInterim.some((t) => t.id === turn.id)) return withoutInterim
        // Dedup same text+role in last few turns
        const last = withoutInterim[withoutInterim.length - 1]
        if (
          last &&
          last.role === turn.role &&
          last.text === turn.text &&
          Date.now() - last.at < 2000
        ) {
          return withoutInterim
        }
        return [...withoutInterim, turn]
      })
      setLiveTurnId(null)
      setPlaybackTime(turn.durationSec)
    }
  },
  [applyAgentPresence, clearSpeakHold]
  )

  const stopEventStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const startEventStream = useCallback(
    async (eventsUrl: string): Promise<boolean> => {
      stopEventStream()
      const ac = new AbortController()
      abortRef.current = ac

      let settleReady: (ready: boolean) => void = () => {}
      let readySettled = false
      const ready = new Promise<boolean>((resolve) => {
        settleReady = (value) => {
          if (readySettled) return
          readySettled = true
          resolve(value)
        }
      })
      const readyTimeout = window.setTimeout(() => settleReady(false), 2_000)

      void (async () => {
        try {
          const res = await fetch(eventsUrl, {
            credentials: "include",
            headers: { Accept: "text/event-stream" },
            signal: ac.signal,
          })
          if (!res.ok || !res.body) {
            console.warn("[voice] SSE failed", res.status, eventsUrl)
            settleReady(false)
            return
          }
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buf = ""
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const parts = buf.split("\n\n")
            buf = parts.pop() ?? ""
            for (const block of parts) {
              const payload = parseSseBlock(block)
              if (payload === null) continue
              applyEvent(payload)
              settleReady(true)
            }
          }
        } catch (e) {
          settleReady(false)
          if (!ac.signal.aborted) {
            console.warn("[voice] SSE stream error", e)
          }
        } finally {
          window.clearTimeout(readyTimeout)
        }
      })()
      return ready
    },
    [applyEvent, stopEventStream]
  )

  const wireDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      dcRef.current = dc
      dc.onmessage = (msg) => {
        try {
          const data =
            typeof msg.data === "string"
              ? msg.data
              : new TextDecoder().decode(msg.data as ArrayBuffer)
          if (typeof data === "string" && data.startsWith("ping")) return
          applyEvent(JSON.parse(data))
        } catch {
          /* ignore non-JSON */
        }
      }
    },
    [applyEvent]
  )

  const cleanup = useCallback(() => {
    stopEventStream()
    clearSpeakHold()
    try {
      dcRef.current?.close()
    } catch {
      /* ignore */
    }
    dcRef.current = null
    pcRef.current?.close()
    pcRef.current = null
    localRef.current?.getTracks().forEach((t) => t.stop())
    localRef.current = null
    micTrackRef.current = null
    setMicMuted(false)
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      audioElRef.current.pause()
    }
  }, [clearSpeakHold, stopEventStream])

  const endSessionRecord = useCallback(
    async (id: string) => {
      try {
        await endMut.mutateAsync({ sessionId: id })
      } catch {
        /* The peer is already closed; final worker flush is best effort. */
      }
    },
    [endMut]
  )

  const handleConnectionState = useCallback(
    (connectionState: RTCPeerConnectionState) => {
      if (connectionState !== "failed" || endingRef.current) return
      setStatus("error")
      clearSpeakHold()
      agentStateRef.current = "asleep"
      setAgentState("asleep")
      setError(
        "The voice connection was lost. Start a new session to reconnect."
      )
    },
    [clearSpeakHold]
  )

  useEffect(() => () => cleanup(), [cleanup])

  const start = useCallback(
    async (trackId: string, config: ConversationSessionConfig) => {
      const attempt = ++attemptRef.current
      const cancelled = () =>
        attemptRef.current !== attempt || endingRef.current
      let createdSessionId: string | null = null

      endingRef.current = false
      setError(null)
      setStatus("creating")
      setTurns([])
      agentStateRef.current = "asleep"
      setAgentState("asleep")
      cleanup()

      try {
        // Mic + audio unlock MUST run near the Start click. After createSession /
        // SSE awaits, the browser often treats play() as autoplay and blocks
        // remote agent audio even though the WebRTC track is fine.
        const audio = ensureAudioElement()
        let localStream: MediaStream
        try {
          localStream = await getVoiceStream(config.microphoneId)
        } catch {
          setStatus("error")
          setError(
            "Microphone permission is required for a live voice session."
          )
          return null
        }
        if (cancelled()) {
          localStream.getTracks().forEach((track) => track.stop())
          return null
        }
        localRef.current = localStream
        for (const t of localStream.getAudioTracks()) {
          t.enabled = true
        }

        // Unlock <audio> by playing the mic stream muted (still user-gesture
        // adjacent). Remote track replaces srcObject later with muted=false.
        try {
          audio.srcObject = localStream
          audio.muted = true
          audio.volume = 1
          await audio.play()
        } catch {
          /* retry when remote track arrives */
        }

        const result = await createMut.mutateAsync({
          trackId,
          sessionKind: config.sessionKind,
          voiceId: config.voice,
          analyzeFace: config.analyzeFace,
          analyzePosture: config.analyzePosture,
        })

        if (cancelled()) {
          if (result.ok) {
            await endSessionRecord(result.session.id)
          }
          return null
        }

        if (!result.ok) {
          setStatus("error")
          setError(creationErrorMessage(result))
          return null
        }

        createdSessionId = result.session.id
        sessionIdRef.current = createdSessionId
        setSessionId(result.session.id)
        setStatus("connecting")
        // Redis pub/sub has no replay. Wait until the SSE subscription sends
        // its initial status before allowing the worker to publish live events.
        await startEventStream(result.eventsUrl)
        if (cancelled()) return null

        const iceServers = (result.iceServers ?? []) as unknown as RTCIceServer[]
        const attachRemote = (stream: MediaStream) => {
          const el = ensureAudioElement()
          if (el.srcObject !== stream) {
            el.srcObject = stream
          }
          el.muted = false
          el.volume = 1
          void el.play().catch((err) => {
            console.warn("[voice] remote audio play blocked", err)
          })
        }

        const { pc, remoteStream, micTrack } = await connectVoiceSession({
          offerUrl: result.offerUrl,
          ticket: result.ticket,
          sessionId: result.session.id,
          localStream,
          iceServers,
          onRemoteTrack: attachRemote,
          onDataChannel: wireDataChannel,
          onConnectionStateChange: handleConnectionState,
        })
        if (cancelled()) {
          pc.close()
          localStream.getTracks().forEach((track) => track.stop())
          return null
        }
        pcRef.current = pc
        micTrackRef.current = micTrack
        setMicMuted(false)

        pc.ondatachannel = (ev) => wireDataChannel(ev.channel)

        attachRemote(remoteStream)

        setStatus("live")
        agentStateRef.current = "idle"
        setAgentState("idle")
        return result.session
      } catch (e) {
        cleanup()
        if (createdSessionId) {
          if (sessionIdRef.current === createdSessionId) {
            sessionIdRef.current = null
          }
          await endSessionRecord(createdSessionId)
        }
        if (cancelled()) return null
        setStatus("error")
        setError(
          e instanceof Error ? e.message : "Failed to start voice session"
        )
        return null
      }
    },
    [
      cleanup,
      createMut,
      endSessionRecord,
      handleConnectionState,
      startEventStream,
      wireDataChannel,
    ]
  )

  const end = useCallback(async () => {
    endingRef.current = true
    attemptRef.current += 1
    const id = sessionIdRef.current
    sessionIdRef.current = null
    cleanup()
    setStatus("ended")
    agentStateRef.current = "asleep"
    setAgentState("asleep")
    if (id) {
      await endSessionRecord(id)
    }
  }, [cleanup, endSessionRecord])

  const setMuted = useCallback((muted: boolean) => {
    const track = micTrackRef.current
    if (track) track.enabled = !muted
    localRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
    setMicMuted(muted)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(!micMuted)
  }, [micMuted, setMuted])

  function ensureAudioElement(): HTMLAudioElement {
    let audio = audioElRef.current
    if (!audio) {
      audio = document.createElement("audio")
      audio.autoplay = true
      audio.setAttribute("playsinline", "true")
      audio.setAttribute("webkit-playsinline", "true")
      // Keep in DOM — detached Audio() is flaky for WebRTC. Avoid display:none
      // (some engines skip media elements that are fully hidden).
      audio.style.cssText =
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;bottom:0"
      document.body.appendChild(audio)
      audioElRef.current = audio
    }
    return audio
  }

  return {
    status,
    error,
    sessionId,
    agentState,
    turns,
    liveTurnId,
    playbackTime,
    start,
    end,
    muted: micMuted,
    setMuted,
    toggleMute,
    isLive: status === "live",
    isBusy:
      createMut.isPending ||
      status === "connecting" ||
      status === "creating",
  }
}

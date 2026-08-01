import { useCallback, useEffect, useRef, useState } from "react"
import { trpc } from "@/lib/trpc"
import { connectVoiceSession } from "../lib/webrtc-offer"
import { textToSegments } from "../lib/transcript-segments"
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

export type VoiceUiEvent =
  | { type: "agent_state"; state: AgentPresenceState }
  | {
      type: "transcript"
      role: "user" | "agent" | "system"
      text: string
      final: boolean
      id?: string
    }
  | { type: "session_status"; status: string }

function isAgentState(s: string): s is AgentPresenceState {
  return (
    s === "asleep" ||
    s === "idle" ||
    s === "listening" ||
    s === "thinking" ||
    s === "speaking"
  )
}

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

function parseVoiceEvent(raw: unknown): VoiceUiEvent | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (o.type === "agent_state" && typeof o.state === "string") {
    if (isAgentState(o.state)) {
      return { type: "agent_state", state: o.state }
    }
    if (o.state === "ready" || o.state === "speakingMuted") {
      return { type: "agent_state", state: "idle" }
    }
    return { type: "agent_state", state: "idle" }
  }
  if (o.type === "transcript" && typeof o.text === "string") {
    const role =
      o.role === "user" || o.role === "agent" || o.role === "system"
        ? o.role
        : "system"
    return {
      type: "transcript",
      role,
      text: o.text,
      final: o.final !== false,
      id: typeof o.id === "string" ? o.id : undefined,
    }
  }
  if (o.type === "session_status" && typeof o.status === "string") {
    return { type: "session_status", status: o.status }
  }
  return null
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
  const [micMuted, setMicMuted] = useState(false)

  const applyEvent = useCallback((raw: unknown) => {
    const ev = parseVoiceEvent(raw)
    if (!ev) return

    if (ev.type === "agent_state") {
      setAgentState(ev.state)
      return
    }
    if (ev.type === "session_status") {
      if (ev.status === "ended" || ev.status === "error") {
        setStatus(ev.status === "error" ? "error" : "ended")
        setAgentState("asleep")
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
  }, [])

  const stopEventStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  const startEventStream = useCallback(
    (eventsUrl: string) => {
      stopEventStream()
      const ac = new AbortController()
      abortRef.current = ac

      void (async () => {
        try {
          const res = await fetch(eventsUrl, {
            credentials: "include",
            headers: { Accept: "text/event-stream" },
            signal: ac.signal,
          })
          if (!res.ok || !res.body) {
            console.warn("[voice] SSE failed", res.status, eventsUrl)
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
              // Skip ping events
              if (block.includes("event: ping")) continue
              const dataLine = block
                .split("\n")
                .find((l) => l.startsWith("data:"))
              if (!dataLine) continue
              const raw = dataLine.slice(5).trim()
              if (!raw || raw === "{}") continue
              try {
                applyEvent(JSON.parse(raw))
              } catch {
                /* ignore */
              }
            }
          }
        } catch (e) {
          if (!ac.signal.aborted) {
            console.warn("[voice] SSE stream error", e)
          }
        }
      })()
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
  }, [stopEventStream])

  useEffect(() => () => cleanup(), [cleanup])

  const start = useCallback(
    async (trackId: string, config: ConversationSessionConfig) => {
      setError(null)
      setStatus("creating")
      setTurns([])
      setAgentState("asleep")
      cleanup()

      try {
        const result = await createMut.mutateAsync({
          trackId,
          sessionKind: config.sessionKind,
          voiceId: config.voice,
          analyzeFace: config.analyzeFace,
          analyzePosture: config.analyzePosture,
        })

        if (!result.ok) {
          setStatus("error")
          const msg =
            "message" in result && result.message
              ? String(result.message)
              : "code" in result
                ? String(result.code)
                : "Failed to create voice session"
          setError(msg)
          return null
        }

        setSessionId(result.session.id)
        setStatus("connecting")
        startEventStream(result.eventsUrl)

        const audioConstraints: MediaTrackConstraints = config.microphoneId
          ? {
              deviceId: { ideal: config.microphoneId },
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
            }
          : {
              echoCancellation: { ideal: true },
              noiseSuppression: { ideal: true },
              autoGainControl: { ideal: true },
            }

        let localStream: MediaStream
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false,
          })
        } catch {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          })
        }
        localRef.current = localStream
        for (const t of localStream.getAudioTracks()) {
          t.enabled = true
        }

        // Unlock playback as early as possible (still within start click chain).
        const audio = ensureAudioElement()
        try {
          // Silent unlock — some browsers require a play() in the gesture chain.
          await audio.play()
        } catch {
          /* will retry when remote track arrives */
        }

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

        const { pc, remoteStream, micTrack, dataChannel } =
          await connectVoiceSession({
            offerUrl: result.offerUrl,
            ticket: result.ticket,
            sessionId: result.session.id,
            localStream,
            iceServers,
            onRemoteTrack: attachRemote,
          })
        pcRef.current = pc
        micTrackRef.current = micTrack
        setMicMuted(false)

        if (dataChannel) wireDataChannel(dataChannel)
        pc.ondatachannel = (ev) => wireDataChannel(ev.channel)

        attachRemote(remoteStream)

        setStatus("live")
        setAgentState("idle")
        return result.session
      } catch (e) {
        cleanup()
        setStatus("error")
        setError(
          e instanceof Error ? e.message : "Failed to start voice session"
        )
        return null
      }
    },
    [applyEvent, cleanup, createMut, startEventStream, wireDataChannel]
  )

  const end = useCallback(async () => {
    const id = sessionId
    cleanup()
    setStatus("ended")
    setAgentState("asleep")
    if (id) {
      try {
        await endMut.mutateAsync({ sessionId: id })
      } catch {
        /* ignore */
      }
    }
  }, [cleanup, endMut, sessionId])

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
      // Keep in DOM — detached Audio() is flaky for WebRTC on some browsers
      audio.style.display = "none"
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

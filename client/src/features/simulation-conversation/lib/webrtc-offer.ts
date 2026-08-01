/**
 * WebRTC offer exchange with Pipecat SmallWebRTC.
 *
 * Must match server transceiver order (audio, video, screenVideo).
 */

export type IceServerConfig = RTCIceServer

export type VoiceOfferResult = {
  pc: RTCPeerConnection
  remoteStream: MediaStream
  micTrack: MediaStreamTrack | null
  dataChannel: RTCDataChannel | null
}

const AUDIO_TRANSCEIVER_INDEX = 0

export async function connectVoiceSession(opts: {
  offerUrl: string
  ticket: string
  sessionId: string
  localStream: MediaStream
  iceServers?: IceServerConfig[]
  /** Called whenever a remote audio track is attached (retry play). */
  onRemoteTrack?: (stream: MediaStream) => void
}): Promise<VoiceOfferResult> {
  const iceServers =
    opts.iceServers && opts.iceServers.length > 0
      ? opts.iceServers
      : [{ urls: "stun:stun.l.google.com:19302" }]

  const pc = new RTCPeerConnection({ iceServers })

  const audioTransceiver = pc.addTransceiver("audio", {
    direction: "sendrecv",
  })
  pc.addTransceiver("video", { direction: "sendrecv" })
  pc.addTransceiver("video", { direction: "sendonly" })

  const micTrack = opts.localStream.getAudioTracks()[0] ?? null
  if (micTrack) {
    micTrack.enabled = true
    await audioTransceiver.sender.replaceTrack(micTrack)
  }

  const remoteStream = new MediaStream()
  pc.ontrack = (ev) => {
    if (ev.track.kind !== "audio") return
    // Avoid duplicates
    const exists = remoteStream
      .getAudioTracks()
      .some((t) => t.id === ev.track.id)
    if (!exists) {
      remoteStream.addTrack(ev.track)
    }
    opts.onRemoteTrack?.(remoteStream)
  }

  let dataChannel: RTCDataChannel | null = null
  try {
    dataChannel = pc.createDataChannel("chat", { ordered: true })
    // Keepalive so server is_connected() stays healthy
    dataChannel.addEventListener("open", () => {
      const id = window.setInterval(() => {
        if (dataChannel?.readyState === "open") {
          dataChannel.send(`ping: ${Date.now()}`)
        } else {
          window.clearInterval(id)
        }
      }, 1000)
      dataChannel?.addEventListener("close", () => window.clearInterval(id))
    })
  } catch {
    dataChannel = null
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await waitForIceGathering(pc)

  const local = pc.localDescription
  if (!local?.sdp) {
    pc.close()
    throw new Error("Failed to create local SDP offer")
  }

  const res = await fetch(opts.offerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sdp: local.sdp,
      type: local.type,
      ticket: opts.ticket,
      sessionId: opts.sessionId,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    pc.close()
    throw new Error(text || `Voice offer failed (${res.status})`)
  }

  const answer = (await res.json()) as {
    sdp: string
    type: RTCSdpType
  }
  await pc.setRemoteDescription({
    sdp: answer.sdp,
    type: answer.type,
  })

  if (micTrack && audioTransceiver.sender.track !== micTrack) {
    await audioTransceiver.sender.replaceTrack(micTrack)
  }
  if (micTrack) micTrack.enabled = true

  void AUDIO_TRANSCEIVER_INDEX

  return { pc, remoteStream, micTrack, dataChannel }
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 4000) {
  if (pc.iceGatheringState === "complete") return Promise.resolve()
  return new Promise<void>((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", onChange)
      resolve()
    }
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done()
    }
    pc.addEventListener("icegatheringstatechange", onChange)
    window.setTimeout(done, timeoutMs)
  })
}

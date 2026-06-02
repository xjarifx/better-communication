"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSocketStore } from "@/stores/socket-store"

const STUN_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

interface UseWebRTCOptions {
  conversationId: string
  isCaller: boolean
  onEndCall: () => void
}

export function useWebRTC({ conversationId, isCaller, onEndCall }: UseWebRTCOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const onEndCallRef = useRef(onEndCall)
  const peerReadyRef = useRef(false)

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoOff, setIsVideoOff] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { socket } = useSocketStore()

  useEffect(() => {
    if (!socket) return

    const handleOffer = async (data: { conversationId: string; sdp: string }) => {
      if (data.conversationId !== conversationId) return
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: data.sdp }),
        )
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit("webrtc:answer", { conversationId, sdp: answer.sdp })
      } catch (err) {
        console.error("Failed to handle offer:", err)
      }
    }

    const handleAnswer = async (data: { conversationId: string; sdp: string }) => {
      if (data.conversationId !== conversationId) return
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: data.sdp }),
        )
      } catch (err) {
        console.error("Failed to handle answer:", err)
      }
    }

    const handleIceCandidate = async (
      data: { conversationId: string; candidate: RTCIceCandidateInit | null },
    ) => {
      if (data.conversationId !== conversationId) return
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.addIceCandidate(
          data.candidate ? new RTCIceCandidate(data.candidate) : null,
        )
      } catch (err) {
        console.error("Failed to add ICE candidate:", err)
      }
    }

    const handlePeerReady = async (data: { conversationId: string }) => {
      if (data.conversationId !== conversationId) return
      peerReadyRef.current = true
      const pc = pcRef.current
      if (!pc || !isCaller) return

      setIsConnecting(true)
      if (!localStreamRef.current) {
        pc.addTransceiver("audio", { direction: "recvonly" })
        pc.addTransceiver("video", { direction: "recvonly" })
      }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit("webrtc:offer", { conversationId, sdp: offer.sdp })
    }

    socket.on("webrtc:offer", handleOffer)
    socket.on("webrtc:answer", handleAnswer)
    socket.on("webrtc:ice-candidate", handleIceCandidate)
    socket.on("webrtc:ready", handlePeerReady)

    return () => {
      socket.off("webrtc:offer", handleOffer)
      socket.off("webrtc:answer", handleAnswer)
      socket.off("webrtc:ice-candidate", handleIceCandidate)
      socket.off("webrtc:ready", handlePeerReady)
      pcRef.current?.close()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      pcRef.current = null
    }
  }, [socket, conversationId, isCaller])

  useEffect(() => {
    onEndCallRef.current = onEndCall
  }, [onEndCall])

  const startCall = useCallback(async (audioEnabled: boolean, videoEnabled: boolean) => {
    if (!socket || pcRef.current) return

    if (audioEnabled || videoEnabled) {
      if (!navigator.mediaDevices) {
        setMediaError("Camera/microphone not available over HTTP. Use HTTPS or localhost.")
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: audioEnabled,
            video: videoEnabled,
          })
          localStreamRef.current = stream
          setLocalStream(stream)
          setMediaError(null)
        } catch (err: unknown) {
          const domErr = err as DOMException
          const message = domErr.name === "NotFoundError"
            ? "No camera or microphone found"
            : domErr.name === "NotAllowedError"
              ? "Camera and microphone access denied"
              : `Camera/microphone error: ${domErr.message}`
          setMediaError(message)
        }
      }
    }

    setIsMuted(!audioEnabled)
    setIsVideoOff(!videoEnabled)
    setIsConnecting(true)

    const pc = new RTCPeerConnection(STUN_SERVERS)
    pcRef.current = pc

    const stream = localStreamRef.current
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      setIsConnected(true)
      setIsConnecting(false)
    }

    pc.onicecandidate = (event) => {
      socket.emit("webrtc:ice-candidate", {
        conversationId,
        candidate: event.candidate ? event.candidate.toJSON() : null,
      })
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      console.log(`[useWebRTC] ICE state: ${state}`)
      if (state === "connected" || state === "completed") {
        setIsConnected(true)
        setIsConnecting(false)
      } else if (state === "failed") {
        console.error("[useWebRTC] ICE connection failed")
        setIsConnecting(false)
      }
    }

    const emitReady = () => {
      socket.emit("webrtc:ready", { conversationId })
    }
    if (socket.connected) {
      emitReady()
    } else {
      socket.once("connect", emitReady)
    }

    if (isCaller && peerReadyRef.current) {
      setIsConnecting(true)
      if (!localStreamRef.current) {
        pc.addTransceiver("audio", { direction: "recvonly" })
        pc.addTransceiver("video", { direction: "recvonly" })
      }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit("webrtc:offer", { conversationId, sdp: offer.sdp })
    }
  }, [socket, conversationId, isCaller])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }, [])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }, [])

  const endCall = useCallback(() => {
    pcRef.current?.close()
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    socket?.emit("call:end", { conversationId })
    onEndCallRef.current()
  }, [socket, conversationId])

  return {
    localStream,
    remoteStream,
    mediaError,
    isMuted,
    isVideoOff,
    isConnected,
    isConnecting,
    startCall,
    toggleMute,
    toggleVideo,
    endCall,
  }
}

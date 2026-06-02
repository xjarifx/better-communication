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

  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const { socket } = useSocketStore()

  useEffect(() => {
    const constraints = { audio: true, video: true }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        localStreamRef.current = stream
        setLocalStream(stream)
      })
      .catch(async (err: DOMException) => {
        if (err.name === "NotFoundError") {
          try {
            const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            localStreamRef.current = audioOnly
            setLocalStream(audioOnly)
            setIsVideoOff(true)
            return
          } catch {
            // audio also not found
          }
          try {
            const videoOnly = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
            localStreamRef.current = videoOnly
            setLocalStream(videoOnly)
            setIsMuted(true)
            return
          } catch {
            // video also not found
          }
        }
        const message = err.name === "NotFoundError"
          ? "No camera or microphone found"
          : err.name === "NotAllowedError"
            ? "Camera and microphone access denied"
            : `Camera/microphone error: ${err.message}`
        console.error("Failed to get media devices:", message)
        setMediaError(message)
        // Proceed without local media — PC creation doesn't block on this
      })
  }, [])

  useEffect(() => {
    if (!socket) return

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
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", {
          conversationId,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    const handleOffer = async (data: { conversationId: string; sdp: string }) => {
      if (data.conversationId !== conversationId) return
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
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: data.sdp }),
        )
      } catch (err) {
        console.error("Failed to handle answer:", err)
      }
    }

    const handleIceCandidate = async (
      data: { conversationId: string; candidate: RTCIceCandidateInit },
    ) => {
      if (data.conversationId !== conversationId) return
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (err) {
        console.error("Failed to add ICE candidate:", err)
      }
    }

    const handlePeerReady = async (data: { conversationId: string }) => {
      if (data.conversationId !== conversationId) return
      if (isCaller) {
        if (!localStreamRef.current) {
          pc.addTransceiver("audio", { direction: "recvonly" })
          pc.addTransceiver("video", { direction: "recvonly" })
        }
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit("webrtc:offer", { conversationId, sdp: offer.sdp })
      }
    }

    socket.on("webrtc:offer", handleOffer)
    socket.on("webrtc:answer", handleAnswer)
    socket.on("webrtc:ice-candidate", handleIceCandidate)
    socket.on("webrtc:ready", handlePeerReady)

    if (!isCaller) {
      socket.emit("webrtc:ready", { conversationId })
    }

    return () => {
      socket.off("webrtc:offer", handleOffer)
      socket.off("webrtc:answer", handleAnswer)
      socket.off("webrtc:ice-candidate", handleIceCandidate)
      socket.off("webrtc:ready", handlePeerReady)
      pc.close()
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      pcRef.current = null
    }
  }, [socket, conversationId, isCaller])

  useEffect(() => {
    onEndCallRef.current = onEndCall
  }, [onEndCall])

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
    toggleMute,
    toggleVideo,
    endCall,
  }
}

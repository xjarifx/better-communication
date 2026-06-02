"use client"

import { useRef, useEffect, useState } from "react"
import { useCallStore } from "@/stores/call-store"
import { useWebRTC } from "@/hooks/use-webrtc"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useRouter } from "next/navigation"

export function VideoCall({
  conversationId,
  isCaller,
  displayName,
}: {
  conversationId: string
  isCaller: boolean
  displayName: string
}) {
  const { endCall: storeEndCall } = useCallStore()
  const router = useRouter()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)

  const [hasJoined, setHasJoined] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [hasVideoPreview, setHasVideoPreview] = useState(false)

  const {
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
  } = useWebRTC({
    conversationId,
    isCaller,
    onEndCall: () => {
      storeEndCall()
      router.push("/messages")
    },
  })

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useEffect(() => {
    if (!videoEnabled) return
    if (!navigator.mediaDevices) return
    let active = true
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
        previewStreamRef.current = stream
        if (previewVideoRef.current) previewVideoRef.current.srcObject = stream
        setHasVideoPreview(true)
      })
      .catch(() => {})
    return () => { active = false }
  }, [videoEnabled])

  useEffect(() => {
    return () => {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const handleToggleAudio = () => {
    setAudioEnabled(!audioEnabled)
  }

  const handleToggleVideo = () => {
    if (videoEnabled) {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop())
        previewStreamRef.current = null
      }
      setHasVideoPreview(false)
    }
    setVideoEnabled(!videoEnabled)
  }

  const handleJoin = () => {
    if (previewStreamRef.current) {
      previewStreamRef.current.getTracks().forEach((t) => t.stop())
      previewStreamRef.current = null
    }
    setHasJoined(true)
    startCall(audioEnabled, videoEnabled)
  }

  if (!hasJoined) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-600">
              <PhoneOff className="h-8 w-8 rotate-135 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Ready to join call?</h2>
            <p className="mt-1 text-sm text-gray-400">{displayName}</p>
          </div>

          <div className="flex justify-center">
            {videoEnabled && hasVideoPreview ? (
              <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                className="h-48 w-80 rounded-lg border border-white/20 bg-gray-900 object-cover"
              />
            ) : (
              <div className="flex h-48 w-80 items-center justify-center rounded-lg border border-white/20 bg-gray-900">
                <VideoOff className="h-10 w-10 text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleToggleAudio}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                audioEnabled
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
              title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {audioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </button>
            <button
              onClick={handleToggleVideo}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                videoEnabled
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
              title={videoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {videoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </button>
          </div>

          <div className="text-center">
            <p className="mb-3 text-xs text-gray-500">
              {!audioEnabled && !videoEnabled
                ? "You will join without audio or video"
                : !audioEnabled
                  ? "Your microphone will be muted"
                  : !videoEnabled
                    ? "Your camera will be off"
                    : "Others will see and hear you"}
            </p>
            <Button
              className="w-48 rounded-full bg-green-600 py-3 text-base hover:bg-green-700"
              onClick={handleJoin}
            >
              Join Call
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const showControls = hasJoined

  return (
    <div className="flex h-full flex-col bg-black">
      {mediaError && (
        <div className="bg-yellow-900/80 px-4 py-1.5 text-center text-xs text-yellow-200">
          {mediaError}
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center">
        {isConnecting && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-yellow-900/90 px-4 py-1 text-xs text-yellow-200">
            Connecting...
          </div>
        )}

        {isConnected && !remoteStream && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-green-900/90 px-4 py-1 text-xs text-green-200">
            Connected
          </div>
        )}

        {remoteStream && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-green-900/90 px-4 py-1 text-xs text-green-200">
            Connected
          </div>
        )}

        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          />
        )}

        {localStream && !remoteStream && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        )}

        {!localStream && !remoteStream && (
          <div className="text-center text-gray-400">
            <PhoneOff className="mx-auto mb-4 h-16 w-16 rotate-135" />
            <p className="text-lg">Waiting for the other person to join</p>
          </div>
        )}

        {remoteStream && localStream && (
          <div className="absolute bottom-4 right-4 z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-28 w-40 rounded-lg border-2 object-cover sm:h-36 sm:w-52 ${
                isVideoOff ? "border-red-500" : "border-white/30"
              }`}
            />
          </div>
        )}
      </div>

      {showControls && (
        <div className="flex items-center justify-center gap-4 border-t border-gray-800 p-4">
          <Button
            variant="secondary"
            size="icon"
            className={`h-12 w-12 rounded-full ${isMuted ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={`h-12 w-12 rounded-full ${isVideoOff ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={endCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      )}
    </div>
  )
}

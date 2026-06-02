"use client"

import { useRef, useEffect } from "react"
import { useCallStore } from "@/stores/call-store"
import { useSocketStore } from "@/stores/socket-store"
import { useWebRTC } from "@/hooks/use-webrtc"
import { Button } from "@/components/ui/button"
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useRouter } from "next/navigation"

export function VideoCall({
  conversationId,
  isCaller,
}: {
  conversationId: string
  isCaller: boolean
}) {
  const { endCall: storeEndCall } = useCallStore()
  const { socket } = useSocketStore()
  const router = useRouter()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const handleEndCall = () => {
    socket?.emit("call:end", { conversationId })
    storeEndCall()
    router.push("/messages")
  }

  const {
    localStream,
    remoteStream,
    mediaError,
    isMuted,
    isVideoOff,
    isConnected,
    toggleMute,
    toggleVideo,
    endCall,
  } = useWebRTC({
    conversationId,
    isCaller,
    onEndCall: handleEndCall,
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

  return (
    <div className="flex h-full flex-col bg-black">
      {mediaError && (
        <div className="bg-yellow-900/80 px-4 py-2 text-center text-sm text-yellow-200">
          {mediaError} — others may not hear or see you
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
              <PhoneOff className="h-12 w-12 rotate-135 text-white" />
            </div>
            <p className="mb-2 text-xl font-semibold text-white">
              {isConnected ? "Connected" : "Connecting..."}
            </p>
            <p className="mb-1 text-sm text-gray-400">
              {isCaller ? "Waiting for the other person to join..." : "Joining call..."}
            </p>
          </div>
        )}

        {localStream && (
          <div className="absolute bottom-4 right-4 z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`rounded-lg border-2 object-cover ${
                isVideoOff ? "border-red-500" : "border-white/30"
              } ${remoteStream ? "h-32 w-44" : "h-48 w-64"}`}
            />
          </div>
        )}
      </div>

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
    </div>
  )
}

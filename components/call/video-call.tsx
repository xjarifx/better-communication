"use client"

import { useCallStore } from "@/stores/call-store"
import { useSocketStore } from "@/stores/socket-store"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function VideoCall({
  roomName,
  roomUrl,
}: {
  roomName: string
  roomUrl: string
}) {
  const { endCall } = useCallStore()
  const { socket } = useSocketStore()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
            <Phone className="h-12 w-12 text-white" />
          </div>
          <p className="mb-2 text-xl font-semibold text-white">
            Connected
          </p>
          <p className="mb-1 text-sm text-gray-400">
            Room: {roomName}
          </p>
          <p className="text-xs text-gray-500">
            Daily.co integration - embed your video component here
          </p>
          <div className="mt-8">
            <iframe
              src={roomUrl}
              className="h-[400px] w-[600px] max-w-full rounded-lg"
              allow="camera; microphone; fullscreen"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-gray-800 p-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Mic className="h-6 w-6" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={() => {
            socket?.emit("call:end", { conversationId: "" })
            endCall()
            router.push("/messages")
          }}
        >
          <PhoneOff className="h-7 w-7" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full"
        >
          <Video className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

export function CallControls() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isMuted ? "destructive" : "secondary"}
        size="icon"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      <Button
        variant={isVideoOff ? "destructive" : "secondary"}
        size="icon"
        onClick={() => setIsVideoOff(!isVideoOff)}
      >
        {isVideoOff ? (
          <VideoOff className="h-5 w-5" />
        ) : (
          <Video className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
}

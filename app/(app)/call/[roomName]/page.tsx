"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { VideoCall, CallControls } from "@/components/call/video-call"
import { useCallStore } from "@/stores/call-store"
import { useGetRoom } from "@/hooks/use-call"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CallPage({
  params,
}: {
  params: Promise<{ roomName: string }>
}) {
  return <CallPageInner params={params} />
}

function CallPageInner({
  params,
}: {
  params: Promise<{ roomName: string }>
}) {
  const { isAuthenticated } = useAuthRedirect()
  const [roomName, setRoomName] = useState<string | null>(null)
  const { activeCall } = useCallStore()
  const { mutate: getRoom, data: roomData, isPending, error } = useGetRoom()
  const router = useRouter()

  useEffect(() => {
    params.then(({ roomName }) => {
      setRoomName(roomName)
      getRoom(roomName)
    })
  }, [params, getRoom])

  if (!isAuthenticated || !roomName) return null

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (error || !roomData) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="mb-4 text-lg">Room not found or unavailable</p>
          <button
            className="rounded bg-white px-4 py-2 text-black"
            onClick={() => router.push("/messages")}
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <VideoCall roomName={roomName} roomUrl={roomData.roomUrl} />
  )
}

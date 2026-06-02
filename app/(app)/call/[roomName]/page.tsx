"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { VideoCall } from "@/components/call/video-call"
import { useCallStore } from "@/stores/call-store"
import { useAuthStore } from "@/stores/auth-store"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const { activeCall } = useCallStore()
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    params.then(({ roomName }) => {
      setConversationId(roomName)
    })
  }, [params])

  if (!isAuthenticated || !conversationId) return null

  if (!activeCall || activeCall.conversationId !== conversationId) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="mb-4 text-lg">No active call found</p>
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

  const isCaller = activeCall.callerId === user?.id

  return (
    <VideoCall
      conversationId={conversationId}
      isCaller={isCaller}
      displayName={user?.displayName ?? "User"}
    />
  )
}

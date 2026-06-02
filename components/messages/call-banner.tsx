"use client"

import { useCallStore } from "@/stores/call-store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"

export function CallBanner({
  conversationId,
}: {
  conversationId: string
}) {
  const { activeCall } = useCallStore()
  const router = useRouter()

  if (!activeCall || activeCall.conversationId !== conversationId) return null

  return (
    <div className="flex items-center justify-between bg-green-50 px-4 py-2 dark:bg-green-950">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          Call in progress
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-green-600 text-green-700"
          onClick={() => router.push(`/call/${activeCall.conversationId}`)}
        >
          Join
        </Button>
      </div>
    </div>
  )
}

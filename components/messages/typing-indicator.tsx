"use client"

import { useSocketStore } from "@/stores/socket-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversation } from "@/hooks/use-conversations"

export function TypingIndicator({
  conversationId,
}: {
  conversationId: string
}) {
  const { typingUsers } = useSocketStore()
  const { user } = useAuthStore()
  const { data: conversation } = useConversation(conversationId)

  const typingUserIds = typingUsers.get(conversationId) ?? []
  const otherTypingUsers = typingUserIds.filter((id) => id !== user?.id)

  if (otherTypingUsers.length === 0) return null

  const names = otherTypingUsers.map((id) => {
    const member = conversation?.members.find((m) => m.id === id)
    return member?.displayName ?? "Someone"
  })

  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names[0]} and ${names.length - 1} others are typing...`

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
      </div>
      <span className="text-xs italic text-muted-foreground">{label}</span>
    </div>
  )
}

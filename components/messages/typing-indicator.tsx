"use client"

import { useSocketStore } from "@/stores/socket-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversation } from "@/hooks/use-conversations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

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

  const typingUserObjects = otherTypingUsers.map((id) => {
    const member = conversation?.members.find((m) => m.id === id)
    return member
  })

  const firstTyper = typingUserObjects[0]
  const names = typingUserObjects.map((u) => u?.displayName ?? "Someone")

  const label =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing...`
        : `${names[0]} and ${names.length - 1} others are typing...`

  return (
    <div className="group mb-1 flex w-full gap-1.5 px-2 py-0.5">
      {firstTyper && (
        <Avatar className="mt-0.5 h-7 w-7 shrink-0">
          <AvatarImage
            src={firstTyper.avatarUrl ?? undefined}
            alt={firstTyper.displayName}
          />
          <AvatarFallback className="text-xs">
            {getInitials(firstTyper.displayName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col">
        <p className="mb-0.5 px-2 text-xs font-medium text-muted-foreground">
          {names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} ${names.length === 2 ? "other" : "others"}`}
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-1 duration-300 rounded-2xl rounded-bl-none bg-muted px-3 py-1.5 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
          </div>
        </div>
      </div>
    </div>
  )
}

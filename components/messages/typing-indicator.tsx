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

  return (
    <div className="group mb-1.5 flex w-full gap-2 px-1 py-0.5">
      {firstTyper && (
        <Avatar className="mt-4 h-8 w-8 shrink-0 ring-2 ring-background">
          <AvatarImage
            src={firstTyper.avatarUrl ?? undefined}
            alt={firstTyper.displayName}
          />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {getInitials(firstTyper.displayName)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col">
        <p className="mb-1 px-3 text-xs font-semibold text-primary">
          {names.length === 1 ? names[0] : `${names[0]} and ${names.length - 1} ${names.length === 2 ? "other" : "others"}`}
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-1 rounded-[1.15rem] rounded-bl-md bg-card px-3.5 py-2 shadow-sm duration-300">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70 [animation-delay:0.2s]" />
          </div>
        </div>
      </div>
    </div>
  )
}

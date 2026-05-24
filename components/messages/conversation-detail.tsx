"use client"

import { useUiStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversation } from "@/hooks/use-conversations"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import { CallBanner } from "@/components/messages/call-banner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getConversationDisplayName, getInitials } from "@/lib/utils"
import { ArrowLeft, Phone, MoreVertical, MessageCircle } from "lucide-react"
import { useCreateRoom } from "@/hooks/use-call"
import { useSocketStore } from "@/stores/socket-store"
import { useRouter } from "next/navigation"

export function ConversationDetail() {
  const { selectedConversationId, selectConversation } = useUiStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: conversation, isLoading } = useConversation(selectedConversationId)
  const { socket } = useSocketStore()
  const { mutate: createRoom, isPending: isCreatingRoom } = useCreateRoom()

  if (!selectedConversationId) {
    return (
      <div className="chat-wallpaper hidden md:flex md:h-full md:items-center md:justify-center">
        <div className="rounded-full bg-card/80 px-5 py-3 text-center shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MessageCircle className="h-4 w-4 text-primary" />
            Select a conversation to start messaging
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="chat-wallpaper flex-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="chat-wallpaper flex h-full items-center justify-center">
        <p className="rounded-full bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
          Conversation not found
        </p>
      </div>
    )
  }

  const displayName = getConversationDisplayName(conversation, user?.id ?? "")

  const handleStartCall = () => {
    createRoom(conversation.id, {
      onSuccess: (data) => {
        socket?.emit("call:start", {
          conversationId: conversation.id,
          roomUrl: data.roomUrl,
        })
        router.push(`/call/${data.roomName}`)
      },
    })
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-2 border-b bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => selectConversation(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-background">
          <AvatarImage
            src={
              conversation.members.find((m) => m.id !== user?.id)?.avatarUrl ??
              undefined
            }
            alt={displayName}
          />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.type === "GROUP"
              ? `${conversation.members.length} members`
              : "Active now"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-primary hover:bg-accent"
          onClick={handleStartCall}
          disabled={isCreatingRoom}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <CallBanner conversationId={conversation.id} />

      <MessageList conversationId={conversation.id} />

      <MessageInput conversationId={conversation.id} />
    </div>
  )
}

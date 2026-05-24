"use client"

import { useUiStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversation } from "@/hooks/use-conversations"
import { useConversations } from "@/hooks/use-conversations"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import { CallBanner } from "@/components/messages/call-banner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getConversationDisplayName, getInitials } from "@/lib/utils"
import { ArrowLeft, Phone, MoreVertical } from "lucide-react"
import { useCallStore } from "@/stores/call-store"
import { useCreateRoom } from "@/hooks/use-call"
import { useSocketStore } from "@/stores/socket-store"
import { useRouter } from "next/navigation"
import { useMessagesStore } from "@/stores/messages-store"

export function ConversationDetail() {
  const { selectedConversationId, selectConversation, sidebarOpen } = useUiStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const { data: conversation, isLoading } = useConversation(selectedConversationId)
  const { socket } = useSocketStore()
  const { mutate: createRoom, isPending: isCreatingRoom } = useCreateRoom()
  const { activeCall } = useCallStore()
  const { unreadCounts, resetUnread } = useMessagesStore()

  if (!selectedConversationId) {
    return (
      <div className="hidden md:flex md:h-full md:items-center md:justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Select a conversation
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4">
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
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => selectConversation(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={
              conversation.members.find((m) => m.id !== user?.id)?.avatarUrl ??
              undefined
            }
            alt={displayName}
          />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.type === "GROUP"
              ? `${conversation.members.length} members`
              : "Active now"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleStartCall}
          disabled={isCreatingRoom}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <CallBanner conversationId={conversation.id} />

      <MessageList conversationId={conversation.id} />

      <MessageInput conversationId={conversation.id} />
    </div>
  )
}

"use client"

import { useUiStore } from "@/stores/ui-store"
import { useAuthStore } from "@/stores/auth-store"
import { useConversations } from "@/hooks/use-conversations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, getConversationDisplayName, getInitials, formatTime } from "@/lib/utils"
import { MessageSquarePlus, Search, LogOut, Loader2 } from "lucide-react"
import { useState } from "react"
import { useLogout } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const { selectedConversationId, selectConversation, sidebarOpen, openModal } = useUiStore()
  const { user } = useAuthStore()
  const { data: conversations, isLoading } = useConversations()
  const logout = useLogout()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations?.filter((c) => {
    if (!searchQuery) return true
    const name = getConversationDisplayName(c, user?.id ?? "")
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-r bg-background md:w-80",
        !sidebarOpen && "hidden md:flex",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Messages</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openModal("createConversation")}
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout()
              router.push("/login")
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="border-b px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {searchQuery
              ? "No conversations found"
              : "No conversations yet. Start one!"}
          </div>
        ) : (
          filteredConversations?.map((conversation) => {
            const displayName = getConversationDisplayName(conversation, user?.id ?? "")
            const isActive = selectedConversationId === conversation.id

            return (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                  isActive && "bg-accent",
                )}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage
                    src={conversation.members.find((m) => m.id !== user?.id)?.avatarUrl ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    {conversation.lastMessage && (
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.lastMessage?.content ?? "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </ScrollArea>

      <div className="flex items-center gap-3 border-t px-4 py-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? ""} />
          <AvatarFallback className="text-xs">
            {getInitials(user?.displayName ?? "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>
  )
}

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

  const filteredConversations = conversations
    ?.filter((c) => {
      if (!searchQuery) return true
      const name = getConversationDisplayName(c, user?.id ?? "")
      return name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.updatedAt
      const bTime = b.lastMessage?.createdAt ?? b.updatedAt
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-r bg-card shadow-sm md:w-[360px]",
        !sidebarOpen && "hidden md:flex",
      )}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="text-xl font-semibold">Chats</h1>
          <p className="text-xs text-muted-foreground">Better Communication</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:bg-accent hover:text-destructive"
            onClick={() => {
              logout()
              router.push("/login")
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="h-10 rounded-full border-0 bg-muted pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="mx-2 rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No conversations found" : "No conversations yet"}
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
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-accent/70",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background">
                  <AvatarImage
                    src={conversation.members.find((m) => m.id !== user?.id)?.avatarUrl ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
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
                  </div>
                </div>
              </button>
            )
          })
        )}
      </ScrollArea>

      <div className="m-3 flex items-center gap-3 rounded-2xl bg-muted/70 px-3 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? ""} />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {getInitials(user?.displayName ?? "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full shadow-sm"
          onClick={() => openModal("createConversation")}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

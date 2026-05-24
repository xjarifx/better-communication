"use client";

import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useConversations } from "@/hooks/use-conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  cn,
  getConversationDisplayName,
  getInitials,
  formatTime,
} from "@/lib/utils";
import { MessageSquarePlus, Search, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export function Sidebar() {
  const { selectedConversationId, selectConversation, sidebarOpen, openModal } =
    useUiStore();
  const { user } = useAuthStore();
  const { data: conversations, isLoading } = useConversations();
  const logout = useLogout();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations
    ?.filter((c) => {
      if (!searchQuery) return true;
      const name = getConversationDisplayName(c, user?.id ?? "");
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.updatedAt;
      const bTime = b.lastMessage?.createdAt ?? b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  return (
    <div
      className={cn(
        "bg-card flex h-full min-h-0 w-full flex-col border-r shadow-sm md:w-[360px] md:shrink-0",
        !sidebarOpen && "hidden md:flex",
      )}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-xl font-semibold">Chats</h1>
          <p className="text-muted-foreground text-xs">Better Communication</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent hover:text-destructive h-9 w-9 rounded-full"
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search"
            className="bg-muted focus-visible:ring-primary h-10 rounded-full border-0 pl-10 shadow-none focus-visible:ring-2 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="bg-muted/60 text-muted-foreground mx-2 rounded-2xl px-4 py-8 text-center text-sm">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filteredConversations?.map((conversation) => {
            const displayName = getConversationDisplayName(
              conversation,
              user?.id ?? "",
            );
            const isActive = selectedConversationId === conversation.id;

            return (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={cn(
                  "hover:bg-accent/70 flex w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                <Avatar className="ring-background h-12 w-12 shrink-0 ring-2">
                  <AvatarImage
                    src={
                      conversation.members.find((m) => m.id !== user?.id)
                        ?.avatarUrl ?? undefined
                    }
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {displayName}
                    </p>
                    {conversation.lastMessage && (
                      <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 items-center justify-between">
                    <p className="text-muted-foreground truncate text-sm">
                      {conversation.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>

      <div className="bg-muted/70 m-3 flex items-center gap-3 rounded-2xl px-3 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={user?.avatarUrl ?? undefined}
            alt={user?.displayName ?? ""}
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {getInitials(user?.displayName ?? "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user?.email}
          </p>
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
  );
}

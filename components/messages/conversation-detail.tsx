"use client";

import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useConversation } from "@/hooks/use-conversations";
import { MessageList } from "@/components/messages/message-list";
import { MessageInput } from "@/components/messages/message-input";
import { CallBanner } from "@/components/messages/call-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getConversationDisplayName, getInitials } from "@/lib/utils";
import { ArrowLeft, Phone, MoreVertical, MessageCircle } from "lucide-react";
import { useCreateRoom } from "@/hooks/use-call";
import { useSocketStore } from "@/stores/socket-store";
import { useRouter } from "next/navigation";

export function ConversationDetail() {
  const { selectedConversationId, selectConversation } = useUiStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: conversation, isLoading } = useConversation(
    selectedConversationId,
  );
  const { socket } = useSocketStore();
  const { mutate: createRoom, isPending: isCreatingRoom } = useCreateRoom();

  if (!selectedConversationId) {
    return (
      <div className="chat-wallpaper hidden h-full min-w-0 md:flex md:items-center md:justify-center">
        <div className="bg-card/80 rounded-full px-5 py-3 text-center shadow-sm backdrop-blur">
          <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="text-primary h-4 w-4" />
            Select a conversation to start messaging
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-col">
        <div className="bg-card flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="chat-wallpaper min-h-0 flex-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="chat-wallpaper flex h-full min-w-0 items-center justify-center">
        <p className="bg-card/80 text-muted-foreground rounded-full px-4 py-2 text-sm shadow-sm">
          Conversation not found
        </p>
      </div>
    );
  }

  const displayName = getConversationDisplayName(conversation, user?.id ?? "");

  const handleStartCall = () => {
    createRoom(conversation.id, {
      onSuccess: (data) => {
        socket?.emit("call:start", {
          conversationId: conversation.id,
          roomUrl: data.roomUrl,
        });
        router.push(`/call/${data.roomName}`);
      },
    });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="bg-card/95 flex h-14 shrink-0 items-center gap-2 border-b px-2.5 py-2 shadow-sm backdrop-blur sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => selectConversation(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="ring-background h-9 w-9 shrink-0 ring-2 sm:h-10 sm:w-10">
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
          <p className="text-muted-foreground truncate text-xs">
            {conversation.type === "GROUP"
              ? `${conversation.members.length} members`
              : "Active now"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary hover:bg-accent h-9 w-9 rounded-full sm:h-10 sm:w-10"
          onClick={handleStartCall}
          disabled={isCreatingRoom}
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full sm:h-10 sm:w-10"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <CallBanner conversationId={conversation.id} />

      <MessageList conversationId={conversation.id} />

      <MessageInput conversationId={conversation.id} />
    </div>
  );
}

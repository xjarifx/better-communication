"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendMessage } from "@/hooks/use-messages";
import { useSocketStore } from "@/stores/socket-store";
import { Smile, Paperclip, Send, Image as ImageIcon } from "lucide-react";

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId);
  const { socket } = useSocketStore();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || isPending) return;

      sendMessage({ type: "TEXT", content: content.trim() });
      setContent("");
      socket?.emit("user:stop-typing", { conversationId });
      inputRef.current?.focus();
    },
    [content, isPending, sendMessage, socket, conversationId],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTyping = useCallback(() => {
    socket?.emit("user:typing", { conversationId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("user:stop-typing", { conversationId });
    }, 3000);
  }, [socket, conversationId]);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card/95 flex min-w-0 shrink-0 items-center gap-1.5 border-t px-2 py-2 shadow-[0_-2px_12px_hsl(205_24%_30%/0.08)] backdrop-blur sm:gap-2 sm:px-3 sm:py-2.5"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-accent hover:text-primary h-10 w-10 shrink-0 rounded-full"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-accent hover:text-primary hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Input
        ref={inputRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          handleTyping();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message"
        className="bg-muted placeholder:text-muted-foreground focus-visible:ring-primary h-11 min-w-0 flex-1 rounded-full border-0 px-4 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-offset-0"
        disabled={isPending}
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:bg-accent hover:text-primary hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex"
      >
        <Smile className="h-4 w-4" />
      </Button>
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="h-11 w-11 shrink-0 rounded-full shadow-sm"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

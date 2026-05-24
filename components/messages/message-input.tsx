"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendMessage } from "@/hooks/use-messages";
import { useSocketStore } from "@/stores/socket-store";
import { Smile, Paperclip, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😎",
  "👍", "👎", "👏", "🙌", "💪", "🤝", "🔥", "❤️",
  "🎉", "🎊", "✨", "💯", "✅", "❌", "⭐", "💡",
  "😅", "🤔", "🙄", "😉", "🥺", "😤", "🤩", "😭",
  "🎶", "💀", "☕", "🍕", "🏆", "🚀", "📸", "💬",
];

interface UploadResponse {
  url: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
}

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState<"file" | "media" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
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
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("user:stop-typing", { conversationId });
    }, 3000);
  }, [socket, conversationId]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const uploadAndSend = useCallback(
    async (file: File, type: "FILE" | "IMAGE") => {
      setUploading(type === "FILE" ? "file" : "media");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const result = await apiClient.upload<UploadResponse>(
          "/api/upload",
          formData,
        );
        sendMessage({
          type,
          fileUrl: result.url,
          thumbnailUrl: result.thumbnailUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
        });
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploading(null);
      }
    },
    [sendMessage],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadAndSend(file, "FILE");
      e.target.value = "";
    },
    [uploadAndSend],
  );

  const handleMediaSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadAndSend(file, "IMAGE");
      e.target.value = "";
    },
    [uploadAndSend],
  );

  const isUploading = uploading !== null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card/95 flex w-full min-w-0 shrink-0 items-center gap-1.5 border-t px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_hsl(205_24%_30%/0.08)] backdrop-blur sm:gap-2 sm:px-4 sm:py-3 lg:px-6 xl:px-8"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelect}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="text-muted-foreground hover:bg-accent hover:text-primary h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11"
      >
        {uploading === "file" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isUploading}
        onClick={() => mediaInputRef.current?.click()}
        className="text-muted-foreground hover:bg-accent hover:text-primary hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex"
      >
        {uploading === "media" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImageIcon className="h-4 w-4" />
        )}
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
        className="bg-muted placeholder:text-muted-foreground focus-visible:ring-primary h-11 min-w-0 flex-1 rounded-full border-0 px-4 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-offset-0 sm:h-12"
        disabled={isPending}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent hover:text-primary hidden h-10 w-10 shrink-0 rounded-full sm:inline-flex"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-72 p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiSelect(emoji)}
                className="hover:bg-accent rounded-md p-1.5 text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending || isUploading}
        className="h-11 w-11 shrink-0 rounded-full shadow-sm sm:h-12 sm:w-12"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}

"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSendMessage } from "@/hooks/use-messages"
import { useSocketStore } from "@/stores/socket-store"
import { useAuthStore } from "@/stores/auth-store"
import { Smile, Paperclip, Send, Image } from "lucide-react"

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId)
  const { socket } = useSocketStore()
  const { user } = useAuthStore()
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!content.trim() || isPending) return

      sendMessage({ type: "TEXT", content: content.trim() })
      setContent("")
      socket?.emit("user:stop-typing", { conversationId })
      inputRef.current?.focus()
    },
    [content, isPending, sendMessage, socket, conversationId],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTyping = useCallback(() => {
    socket?.emit("user:typing", { conversationId })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("user:stop-typing", { conversationId })
    }, 3000)
  }, [socket, conversationId])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 border-t px-2 py-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent"
      >
        <Image className="h-4 w-4" />
      </Button>
      <Input
        ref={inputRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          handleTyping()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        className="flex-1 rounded-full border-none bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
        disabled={isPending}
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent"
      >
        <Smile className="h-4 w-4" />
      </Button>
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="h-9 w-9 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}

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
      className="flex items-center gap-2 border-t px-4 py-3"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
      >
        <Image className="h-5 w-5" />
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
        className="flex-1"
        disabled={isPending}
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
      >
        <Smile className="h-5 w-5" />
      </Button>
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  )
}

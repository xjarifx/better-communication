"use client"

import { useState, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSendMessage } from "@/hooks/use-messages"
import { useSocketStore } from "@/stores/socket-store"
import { Smile, Paperclip, Send, Image as ImageIcon } from "lucide-react"

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId)
  const { socket } = useSocketStore()
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
      className="flex items-center gap-2 border-t bg-card/95 px-3 py-2.5 shadow-[0_-2px_12px_hsl(205_24%_30%/0.08)] backdrop-blur"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-primary sm:inline-flex"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
      <Input
        ref={inputRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          handleTyping()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message"
        className="h-11 flex-1 rounded-full border-0 bg-muted px-4 text-sm shadow-inner placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
        disabled={isPending}
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
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
  )
}

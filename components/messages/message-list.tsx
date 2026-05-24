"use client"

import { useEffect, useRef, useCallback } from "react"
import { useMessages } from "@/hooks/use-messages"
import { useMessagesStore } from "@/stores/messages-store"
import { useMessageQueueStore } from "@/stores/message-queue-store"
import { useAuthStore } from "@/stores/auth-store"
import { MessageItem } from "@/components/messages/message-item"
import { TypingIndicator } from "@/components/messages/typing-indicator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { shouldShowDateSeparator, formatDateSeparator } from "@/lib/utils"
import type { Message } from "@/types/message"

export function MessageList({ conversationId }: { conversationId: string }) {
  const { user } = useAuthStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useMessages(conversationId)
  const { optimisticMessages } = useMessagesStore()
  const { getConversationQueue } = useMessageQueueStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)

  const allMessages = data?.pages.flatMap((page) => page.messages) ?? []
  const optimistic = optimisticMessages.get(conversationId) ?? []
  const queued = getConversationQueue(conversationId)

  // Merge optimistic and queued messages with server messages
  const mergedMessages = [...optimistic, ...queued, ...allMessages]
  // Deduplicate by id
  const seen = new Set<string>()
  const dedupedMessages = mergedMessages.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (dedupedMessages.length > prevMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessageCountRef.current = dedupedMessages.length
  }, [dedupedMessages.length])

  // Scroll to bottom on first load
  useEffect(() => {
    if (!isLoading && dedupedMessages.length > 0) {
      bottomRef.current?.scrollIntoView()
    }
  }, [isLoading])

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget
      if (target.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
        const prevScrollHeight = target.scrollHeight
        fetchNextPage().then(() => {
          // Maintain scroll position after loading older messages
          requestAnimationFrame(() => {
            target.scrollTop = target.scrollHeight - prevScrollHeight
          })
        })
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 px-2 py-1" onScrollCapture={handleScroll}>
      {isFetchingNextPage && (
        <div className="flex justify-center py-1">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {dedupedMessages.length === 0 && !isFetchingNextPage && (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        </div>
      )}

      {dedupedMessages.map((message, index) => {
        const prevMessage = index > 0 ? dedupedMessages[index - 1] : null
        const showDateSeparator = shouldShowDateSeparator(
          message.createdAt,
          prevMessage?.createdAt ?? null,
        )
        const isOwn = message.sender.id === user?.id
        const showSender =
          !isOwn &&
          (prevMessage?.sender.id !== message.sender.id || showDateSeparator)

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 border-t" />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateSeparator(message.createdAt)}
                </span>
                <div className="flex-1 border-t" />
              </div>
            )}
            <MessageItem
              message={message}
              isOwn={isOwn}
              showSender={showSender}
              isOptimistic={message.id.startsWith("temp-")}
            />
          </div>
        )
      })}

      <TypingIndicator conversationId={conversationId} />
      <div ref={bottomRef} />
    </ScrollArea>
  )
}

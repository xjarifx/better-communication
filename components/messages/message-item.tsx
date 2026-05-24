"use client"

import { useState } from "react"
import type { Message } from "@/types/message"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatMessageTime, getInitials } from "@/lib/utils"
import { useEditMessage, useDeleteMessage } from "@/hooks/use-messages"
import { useSocketStore } from "@/stores/socket-store"
import { useMessageQueueStore } from "@/stores/message-queue-store"
import { MessageStatusBadge } from "./message-status-badge"
import { retryMessage } from "@/lib/message-queue"
import { Edit3, Trash2, Check, X, RotateCw, CheckCheck } from "lucide-react"

export function MessageItem({
  message,
  isOwn,
  showSender,
  isOptimistic,
}: {
  message: Message
  isOwn: boolean
  showSender: boolean
  isOptimistic: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content ?? "")
  const { mutate: editMessage } = useEditMessage()
  const { mutate: deleteMessage } = useDeleteMessage()
  const { socket } = useSocketStore()
  const { getQueuedMessage } = useMessageQueueStore()
  
  // Check if this message is in the queue
  const queuedMessage = getQueuedMessage(message.id)
  const messageStatus = queuedMessage?.status
  const failureReason = queuedMessage?.failureReason

  const handleEdit = () => {
    if (!editContent.trim()) return
    editMessage(
      { messageId: message.id, content: editContent.trim() },
      { onSuccess: () => setIsEditing(false) },
    )
    socket?.emit("message:edit", { messageId: message.id, content: editContent.trim() })
  }

  const handleDelete = () => {
    deleteMessage(message.id)
    socket?.emit("message:delete", { messageId: message.id })
  }

  const handleContextEdit = () => {
    setEditContent(message.content ?? "")
    setIsEditing(true)
  }
  
  const handleRetry = () => {
    if (messageStatus === "failed") {
      retryMessage(message.id)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "group mb-1.5 flex w-full gap-2 px-1 py-0.5",
            isOwn ? "flex-row-reverse justify-end" : "flex-row justify-start",
          )}
        >
          {showSender && !isOwn && (
            <Avatar className="mt-4 h-8 w-8 shrink-0 ring-2 ring-background">
              <AvatarImage
                src={message.sender.avatarUrl ?? undefined}
                alt={message.sender.displayName}
              />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {getInitials(message.sender.displayName)}
              </AvatarFallback>
            </Avatar>
          )}

          {!showSender && !isOwn && <div className="w-8 shrink-0" />}

          <div className={cn("flex max-w-[82%] flex-col sm:max-w-[70%]", isOwn && "items-end")}>
            {showSender && !isOwn && (
              <p className="mb-1 px-3 text-xs font-semibold text-primary">
                {message.sender.displayName}
              </p>
            )}

            <div
              className={cn(
                "animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden rounded-[1.15rem] px-3.5 py-2 shadow-sm duration-300",
                isOwn
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-card text-card-foreground",
                isOptimistic && "opacity-60",
              )}
            >
              {message.type === "IMAGE" || message.type === "FILE" ? (
                <div className="space-y-1">
                  {message.thumbnailUrl && (
                    <img
                      src={message.thumbnailUrl}
                      alt={message.fileName ?? "Image"}
                      className="max-w-[240px] rounded-xl object-cover"
                    />
                  )}
                  {message.fileUrl && message.type === "FILE" && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-2 text-sm underline",
                        isOwn ? "text-primary-foreground" : "text-primary"
                      )}
                    >
                      {message.fileName ?? "File"}
                    </a>
                  )}
                  {message.content && (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              ) : isEditing ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="h-8 min-w-[200px] text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEdit()
                      if (e.key === "Escape") setIsEditing(false)
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleEdit}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}

              {!isEditing && (
                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[11px]",
                    isOwn ? "text-primary-foreground/75" : "text-muted-foreground",
                  )}
                >
                  {isOptimistic ? (
                    <span>Sending</span>
                  ) : (
                    <span>{formatMessageTime(message.createdAt)}</span>
                  )}
                  {isOwn && !isOptimistic && <CheckCheck className="h-3.5 w-3.5" />}
                </div>
              )}
            </div>

            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
                      isOwn && "justify-end",
                    )}
                  >
                    {messageStatus && isOwn && (
                      <>
                        <MessageStatusBadge 
                          status={messageStatus}
                          failureReason={failureReason}
                        />
                        {messageStatus === "failed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 gap-1 px-1 text-xs"
                            onClick={handleRetry}
                            title="Retry sending this message"
                          >
                            <RotateCw className="h-3 w-3" />
                            Retry
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={isOwn ? "left" : "right"} className="text-xs">
                  {new Date(message.createdAt).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ContextMenuTrigger>

      {isOwn && !isOptimistic && (
        <ContextMenuContent>
          <ContextMenuItem onClick={handleContextEdit}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}

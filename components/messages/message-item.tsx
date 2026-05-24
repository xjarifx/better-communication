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
import { cn, formatMessageTime, getInitials } from "@/lib/utils"
import { useEditMessage, useDeleteMessage } from "@/hooks/use-messages"
import { useSocketStore } from "@/stores/socket-store"
import { Edit3, Trash2, Check, X } from "lucide-react"

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

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "mb-2 flex gap-2",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          {showSender && !isOwn && (
            <Avatar className="mt-1 h-8 w-8 shrink-0">
              <AvatarImage
                src={message.sender.avatarUrl ?? undefined}
                alt={message.sender.displayName}
              />
              <AvatarFallback className="text-xs">
                {getInitials(message.sender.displayName)}
              </AvatarFallback>
            </Avatar>
          )}

          {!showSender && !isOwn && <div className="w-8 shrink-0" />}

          <div className={cn("max-w-[75%]", isOwn && "items-end")}>
            {showSender && !isOwn && (
              <p className="mb-1 ml-1 text-xs text-muted-foreground">
                {message.sender.displayName}
              </p>
            )}

            <div
              className={cn(
                "rounded-2xl px-3 py-2",
                isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
                isOptimistic && "opacity-60",
              )}
            >
              {message.type === "IMAGE" || message.type === "FILE" ? (
                <div className="space-y-1">
                  {message.thumbnailUrl && (
                    <img
                      src={message.thumbnailUrl}
                      alt={message.fileName ?? "Image"}
                      className="max-w-[200px] rounded-lg object-cover"
                    />
                  )}
                  {message.fileUrl && message.type === "FILE" && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm underline"
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
                <p className="text-sm">{message.content}</p>
              )}
            </div>

            <div
              className={cn(
                "mt-0.5 flex items-center gap-1 px-1",
                isOwn && "justify-end",
              )}
            >
              <span className="text-[10px] text-muted-foreground">
                {formatMessageTime(message.createdAt)}
              </span>
              {isOptimistic && (
                <span className="text-[10px] text-muted-foreground italic">
                  Sending...
                </span>
              )}
            </div>
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

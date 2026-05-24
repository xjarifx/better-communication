"use client"

import type { MessageStatus } from "@/stores/message-queue-store"

interface MessageStatusBadgeProps {
  status?: MessageStatus
  failureReason?: string
  showLabel?: boolean
}

export function MessageStatusBadge({
  status = "sent",
  failureReason,
  showLabel = false,
}: MessageStatusBadgeProps) {
  if (status === "sent") {
    return null // Don't show badge for sent messages
  }

  const statusConfig = {
    pending: {
      label: "Pending",
      icon: "⏱️",
      color: "bg-yellow-100 text-yellow-800",
      description: "Waiting to send",
    },
    sending: {
      label: "Sending",
      icon: "📤",
      color: "bg-blue-100 text-blue-800",
      description: "Sending message",
    },
    failed: {
      label: "Failed",
      icon: "❌",
      color: "bg-red-100 text-red-800",
      description: failureReason || "Failed to send",
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}
      title={config.description}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}

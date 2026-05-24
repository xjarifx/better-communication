"use client"

import { MessageSquare } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Your Messages
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Send private messages or create a group conversation
        </p>
      </div>
    </div>
  )
}

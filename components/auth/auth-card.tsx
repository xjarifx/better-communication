"use client"

import { cn } from "@/lib/utils"

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "chat-wallpaper flex min-h-screen items-center justify-center px-4 py-8",
        className,
      )}
    >
      {children}
    </div>
  )
}

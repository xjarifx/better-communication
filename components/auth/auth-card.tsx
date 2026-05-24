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
        "flex min-h-screen items-center justify-center bg-muted/50 px-4",
        className,
      )}
    >
      {children}
    </div>
  )
}

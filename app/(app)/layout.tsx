"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { AppLayout } from "@/components/layout/app-layout"
import { Loader2 } from "lucide-react"

export default function AppPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isHydrated } = useAuthRedirect()

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <AppLayout>{children}</AppLayout>
}

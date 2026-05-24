"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { AppLayout } from "@/components/layout/app-layout"

export default function AppPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated } = useAuthRedirect()

  if (!isAuthenticated) {
    return null
  }

  return <AppLayout>{children}</AppLayout>
}

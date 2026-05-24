"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

export function useAuthRedirect() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login")
    }
  }, [accessToken, user, router])

  return { user, accessToken, isAuthenticated: !!accessToken && !!user }
}

export function useGuestRedirect() {
  const router = useRouter()
  const { accessToken, user } = useAuthStore()

  useEffect(() => {
    if (accessToken && user) {
      router.replace("/messages")
    }
  }, [accessToken, user, router])
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

export function useAuthRedirect() {
  const router = useRouter()
  const { user, accessToken } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist middleware to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (!accessToken || !user) {
      router.replace("/login")
    }
  }, [accessToken, user, router, isHydrated])

  return { user, accessToken, isAuthenticated: !!accessToken && !!user, isHydrated }
}

export function useGuestRedirect() {
  const router = useRouter()
  const { accessToken, user } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for Zustand persist middleware to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (accessToken && user) {
      router.replace("/messages")
    }
  }, [accessToken, user, router, isHydrated])
}

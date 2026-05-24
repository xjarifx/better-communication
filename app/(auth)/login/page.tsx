"use client"

import { LoginForm } from "@/components/auth/login-form"
import { AuthCard } from "@/components/auth/auth-card"
import { useGuestRedirect } from "@/hooks/use-auth-redirect"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  useGuestRedirect()

  return (
    <AuthCard>
      <LoginForm />
    </AuthCard>
  )
}

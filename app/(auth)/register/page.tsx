"use client"

import { RegisterForm } from "@/components/auth/register-form"
import { AuthCard } from "@/components/auth/auth-card"
import { useGuestRedirect } from "@/hooks/use-auth-redirect"

export default function RegisterPage() {
  useGuestRedirect()

  return (
    <AuthCard>
      <RegisterForm />
    </AuthCard>
  )
}

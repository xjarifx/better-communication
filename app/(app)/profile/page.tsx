"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { UserProfileCard, ProfileSettings } from "@/components/profile/user-profile-card"
import { LogoutButton } from "@/components/profile/logout-button"
import { Header } from "@/components/layout/header"

export default function ProfilePage() {
  const { isAuthenticated } = useAuthRedirect()

  if (!isAuthenticated) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <UserProfileCard />
      <ProfileSettings />
      <LogoutButton />
    </div>
  )
}

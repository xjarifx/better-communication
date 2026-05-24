"use client"

import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { UserProfileCard, ProfileSettings } from "@/components/profile/user-profile-card"
import { LogoutButton } from "@/components/profile/logout-button"

export default function ProfilePage() {
  const { isAuthenticated } = useAuthRedirect()

  if (!isAuthenticated) return null

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <UserProfileCard />
        <ProfileSettings />
        <LogoutButton />
      </div>
    </div>
  )
}

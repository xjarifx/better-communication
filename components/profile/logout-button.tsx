"use client"

import { useLogout } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function LogoutButton() {
  const logout = useLogout()
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Out</CardTitle>
        <CardDescription>
          Sign out of your account on this device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            logout()
            router.push("/login")
          }}
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  )
}

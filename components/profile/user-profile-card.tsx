"use client"

import { useAuthStore } from "@/stores/auth-store"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"

const ProfileFormSchema = z.object({
  displayName: z.string().min(1).max(50),
  email: z.string().email(),
})

type ProfileFormData = z.output<typeof ProfileFormSchema>

export function UserProfileCard() {
  const { user } = useAuthStore()

  if (!user) return null

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-accent">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
            <AvatarFallback className="bg-primary text-lg text-primary-foreground">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{user.displayName}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

export function ProfileSettings() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    toast({ title: "Profile updated", variant: "success" })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" className="rounded-xl bg-muted/70" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="rounded-xl bg-muted/70" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="rounded-xl">Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  )
}

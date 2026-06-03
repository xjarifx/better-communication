"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useLogin } from "@/hooks/use-auth"
import { LoginFormSchema, type LoginFormData } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError } from "@/lib/api-client"
import { MessageCircle } from "lucide-react"

export function LoginForm() {
  console.log("[LoginForm] Component rendering")
  const router = useRouter()
  const { mutate: login, isPending, error } = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
  })

  console.log("[LoginForm] handleSubmit type:", typeof handleSubmit)

  const onSubmit = (data: LoginFormData) => {
    console.log("[LoginForm] onSubmit called with data", { email: data.email })
    login(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          router.push("/messages")
        },
      },
    )
  }

  const handleClick = () => {
    console.log("[LoginForm] Button clicked")
    try {
      handleSubmit(onSubmit)()
      console.log("[LoginForm] handleSubmit completed")
    } catch (err) {
      console.error("[LoginForm] handleSubmit error:", err)
    }
  }

  const DEMO_ACCOUNTS = [
    { email: "jarif@gmail.com", label: "Demo Account 1" },
    { email: "jarif2@gmail.com", label: "Demo Account 2" },
  ]

  const handleDemoLogin = (email: string) => {
    login(
      { email, password: email },
      {
        onSuccess: () => {
          router.push("/messages")
        },
      },
    )
  }

  return (
    <Card className="w-full max-w-md border-0 bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <MessageCircle className="h-6 w-6" />
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in and continue your conversations</CardDescription>
      </CardHeader>
      <form
          onSubmit={(e) => {
            e.preventDefault()
            console.log("[LoginForm] Form onSubmit fired")
            handleSubmit(onSubmit)(e)
          }}
        >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="rounded-xl bg-muted/70"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="rounded-xl bg-muted/70"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <p className="text-sm text-destructive">
              {error instanceof ApiError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : "An unexpected error occurred. Check the console for details."}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="button" className="h-11 w-full rounded-xl" disabled={isPending} onClick={handleClick}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <div className="flex w-full flex-col gap-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Demo Accounts</span>
              </div>
            </div>
            {DEMO_ACCOUNTS.map((account, i) => (
              <Button
                key={account.email}
                type="button"
                variant="default"
                size="sm"
                disabled={isPending}
                onClick={() => handleDemoLogin(account.email)}
                className="bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40 hover:bg-emerald-500 hover:shadow-lg active:scale-[0.98]"
              >
                Try {account.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

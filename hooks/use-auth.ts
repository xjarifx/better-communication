import { useMutation } from "@tanstack/react-query"
import { apiClient, ApiError } from "@/lib/api-client"
import type { AuthResponse, LoginInput, RegisterInput } from "@/types/auth"
import { useAuthStore } from "@/stores/auth-store"
import { initSocket, disconnectSocket } from "@/lib/socket-client"
import { useSocketStore } from "@/stores/socket-store"

export function useLogin() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiClient.post<AuthResponse>("/api/auth/login", input),

    onSuccess: (data) => {
      console.log("[useLogin] Login successful, storing token and connecting socket", {
        userId: data.user.id,
        tokenLength: data.accessToken.length,
      })
      authStore.login(data.user, data.accessToken)
      initSocketAndJoin(data.accessToken)
    },
  })
}

export function useRegister() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiClient.post<AuthResponse>("/api/auth/register", input),

    onSuccess: (data) => {
      console.log("[useRegister] Registration successful, storing token and connecting socket", {
        userId: data.user.id,
        tokenLength: data.accessToken.length,
      })
      authStore.login(data.user, data.accessToken)
      initSocketAndJoin(data.accessToken)
    },
  })
}

export function useLogout() {
  const authStore = useAuthStore()
  const socketStore = useSocketStore.getState()

  return () => {
    console.log("[useLogout] Logging out...")
    socketStore.socket?.disconnect()
    disconnectSocket()
    authStore.logout()
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
  }
}

function initSocketAndJoin(token: string) {
  console.log("[initSocketAndJoin] Initializing socket with token")
  const socket = initSocket(token)
  useSocketStore.getState().setSocket(socket)

  socket.on("connect", () => {
    console.log("[initSocketAndJoin] Socket connected!")
    useSocketStore.getState().setConnected(true)
  })

  socket.on("disconnect", () => {
    console.log("[initSocketAndJoin] Socket disconnected")
    useSocketStore.getState().setConnected(false)
  })

  socket.on("connect_error", (error) => {
    console.error("[initSocketAndJoin] Socket connection error:", error)
  })
}

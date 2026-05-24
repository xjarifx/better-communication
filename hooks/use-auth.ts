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
      authStore.login(data.user, data.accessToken)
      initSocketAndJoin(data.accessToken)
    },
  })
}

export function useLogout() {
  const authStore = useAuthStore()
  const socketStore = useSocketStore.getState()

  return () => {
    socketStore.socket?.disconnect()
    disconnectSocket()
    authStore.logout()
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
  }
}

function initSocketAndJoin(token: string) {
  const socket = initSocket(token)
  useSocketStore.getState().setSocket(socket)

  socket.on("connect", () => {
    useSocketStore.getState().setConnected(true)
  })

  socket.on("disconnect", () => {
    useSocketStore.getState().setConnected(false)
  })
}

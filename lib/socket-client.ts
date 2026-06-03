import { io, Socket } from "socket.io-client"
import { startQueueProcessing, stopQueueProcessing } from "./message-queue"
import { useSocketStore } from "@/stores/socket-store"
import { useMessageQueueStore } from "@/stores/message-queue-store"
import { refreshToken } from "./api-client"
import { useAuthStore } from "@/stores/auth-store"

let socket: Socket | null = null
let refreshAttempted = false

const TRACE = process.env.NEXT_PUBLIC_WS_TRACE === "true"

export function getSocket(): Socket | null {
  return socket
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect()
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    ?? (() => {
      const port = process.env.NEXT_PUBLIC_SOCKET_PORT ?? "3001"
      const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
      const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "http"
      return `${protocol}://${hostname}:${port}`
    })()

  console.log(`[socket-client] Connecting to ${socketUrl}`)

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  if (TRACE) {
    socket.onAny((event, ...args) => {
      console.log(`[ws-in] ${event}`, args)
    })
  }

  socket.on("connect", () => {
    console.log(`[socket-client] Connected! Socket ID: ${socket?.id}`)
    refreshAttempted = false

    const { setConnected } = useSocketStore.getState()
    setConnected(true)

    const { hydrate } = useMessageQueueStore.getState()
    hydrate()
    startQueueProcessing()
  })

  socket.on("disconnect", () => {
    console.log(`[socket-client] Disconnected`)

    const { setConnected } = useSocketStore.getState()
    setConnected(false)

    stopQueueProcessing()
  })

  socket.on("connect_error", async (error) => {
    console.error(`[socket-client] Connection error:`, error.message || error)

    const errorMessage = error.message || String(error)
    if (
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("Authentication failed")
    ) {
      if (!refreshAttempted) {
        console.log("[socket-client] Attempting to refresh token...")
        refreshAttempted = true

        try {
          const newToken = await refreshToken()
          if (newToken) {
            console.log("[socket-client] Token refreshed successfully")
            const { setAccessToken } = useAuthStore.getState()
            setAccessToken(newToken)

            if (socket) {
              socket.auth = { token: newToken }
              socket.connect()
            }
          } else {
            console.error("[socket-client] Failed to refresh token - user may need to log in again")
          }
        } catch (err) {
          console.error("[socket-client] Error refreshing token:", err)
        }
      } else {
        console.error("[socket-client] Token refresh already attempted, skipping retry")
      }
    }
  })

  socket.on("error", (error) => {
    console.error(`[socket-client] Socket error:`, error)
  })

  return socket
}

export function disconnectSocket(): void {
  refreshAttempted = false
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

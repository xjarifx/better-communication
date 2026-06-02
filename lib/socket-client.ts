import { io, Socket } from "socket.io-client"
import { startQueueProcessing, stopQueueProcessing } from "./message-queue"
import { useSocketStore } from "@/stores/socket-store"
import { useMessageQueueStore } from "@/stores/message-queue-store"
import { refreshToken } from "./api-client"
import { useAuthStore } from "@/stores/auth-store"

let socket: Socket | null = null
let refreshAttempted = false

export function getSocket(): Socket | null {
  return socket
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect()
  }

  const port = process.env.NEXT_PUBLIC_SOCKET_PORT ?? "3001"
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost"
  const socketUrl = `http://${hostname}:${port}`
  
  console.log(`[socket-client] Token details:`, {
    exists: !!token,
    length: token?.length ?? 0,
    prefix: token?.slice(0, 20) + "...",
  })
  console.log(`[socket-client] Connecting to ${socketUrl}`)

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on("connect", () => {
    console.log(`[socket-client] Connected! Socket ID: ${socket?.id}`)
    refreshAttempted = false
    
    // Update socket store
    const { setConnected } = useSocketStore.getState()
    setConnected(true)
    
    // Hydrate queue from storage and start processing
    const { hydrate } = useMessageQueueStore.getState()
    hydrate()
    startQueueProcessing()
  })

  socket.on("disconnect", () => {
    console.log(`[socket-client] Disconnected`)
    
    // Update socket store
    const { setConnected } = useSocketStore.getState()
    setConnected(false)
    
    // Stop queue processing when offline
    stopQueueProcessing()
  })

  socket.on("connect_error", async (error) => {
    console.error(`[socket-client] Connection error:`, error.message || error)
    
    // Check if this is a JWT expiration error
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
            // Update auth store with new token
            const { setAccessToken } = useAuthStore.getState()
            setAccessToken(newToken)
            
            // Reconnect with new token
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

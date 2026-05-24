import { io, Socket } from "socket.io-client"
import { processMessageQueue, startQueueProcessing, stopQueueProcessing } from "./message-queue"
import { useSocketStore } from "@/stores/socket-store"
import { useMessageQueueStore } from "@/stores/message-queue-store"

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect()
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001"
  
  console.log(`[socket-client] Connecting to ${socketUrl} with token: ${token.slice(0, 20)}...`)

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

  socket.on("connect_error", (error) => {
    console.error(`[socket-client] Connection error:`, error)
  })

  socket.on("error", (error) => {
    console.error(`[socket-client] Error:`, error)
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

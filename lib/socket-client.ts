import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect()
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001"

  socket = io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

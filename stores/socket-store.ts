import { create } from "zustand"
import type { Socket } from "socket.io-client"

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  typingUsers: Map<string, string[]>
  onlineUsers: Set<string>
  setSocket: (socket: Socket | null) => void
  setConnected: (connected: boolean) => void
  addTypingUser: (conversationId: string, userId: string) => void
  removeTypingUser: (conversationId: string, userId: string) => void
  clearTypingUsers: (conversationId: string) => void
  setOnlineUser: (userId: string, online: boolean) => void
  isUserOnline: (userId: string) => boolean
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  isConnected: false,
  typingUsers: new Map(),
  onlineUsers: new Set(),

  setSocket: (socket) => set({ socket }),

  setConnected: (isConnected) => set({ isConnected }),

  addTypingUser: (conversationId, userId) =>
    set((state) => {
      const users = state.typingUsers.get(conversationId) ?? []
      if (users.includes(userId)) return state
      const updated = new Map(state.typingUsers)
      updated.set(conversationId, [...users, userId])

      setTimeout(() => {
        get().removeTypingUser(conversationId, userId)
      }, 4000)

      return { typingUsers: updated }
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const users = state.typingUsers.get(conversationId) ?? []
      const updated = new Map(state.typingUsers)
      updated.set(
        conversationId,
        users.filter((u) => u !== userId),
      )
      return { typingUsers: updated }
    }),

  clearTypingUsers: (conversationId) =>
    set((state) => {
      const updated = new Map(state.typingUsers)
      updated.delete(conversationId)
      return { typingUsers: updated }
    }),

  setOnlineUser: (userId, online) =>
    set((state) => {
      const updated = new Set(state.onlineUsers)
      if (online) {
        updated.add(userId)
      } else {
        updated.delete(userId)
      }
      return { onlineUsers: updated }
    }),

  isUserOnline: (userId) => get().onlineUsers.has(userId),
}))

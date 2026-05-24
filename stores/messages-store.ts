import { create } from "zustand"
import type { Message } from "@/types/message"

interface MessagesState {
  unreadCounts: Map<string, number>
  optimisticMessages: Map<string, Message[]>
  updateUnreadCount: (conversationId: string, count: number) => void
  incrementUnread: (conversationId: string) => void
  resetUnread: (conversationId: string) => void
  addOptimisticMessage: (conversationId: string, message: Message) => void
  removeOptimisticMessage: (conversationId: string, tempId: string) => void
  clearOptimisticMessages: (conversationId: string) => void
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  unreadCounts: new Map(),
  optimisticMessages: new Map(),

  updateUnreadCount: (conversationId, count) =>
    set((state) => {
      const updated = new Map(state.unreadCounts)
      updated.set(conversationId, count)
      return { unreadCounts: updated }
    }),

  incrementUnread: (conversationId) =>
    set((state) => {
      const updated = new Map(state.unreadCounts)
      const current = updated.get(conversationId) ?? 0
      updated.set(conversationId, current + 1)
      return { unreadCounts: updated }
    }),

  resetUnread: (conversationId) =>
    set((state) => {
      const updated = new Map(state.unreadCounts)
      updated.set(conversationId, 0)
      return { unreadCounts: updated }
    }),

  addOptimisticMessage: (conversationId, message) =>
    set((state) => {
      const updated = new Map(state.optimisticMessages)
      const current = updated.get(conversationId) ?? []
      updated.set(conversationId, [message, ...current])
      return { optimisticMessages: updated }
    }),

  removeOptimisticMessage: (conversationId, tempId) =>
    set((state) => {
      const updated = new Map(state.optimisticMessages)
      const current = updated.get(conversationId) ?? []
      updated.set(
        conversationId,
        current.filter((m) => m.id !== tempId),
      )
      return { optimisticMessages: updated }
    }),

  clearOptimisticMessages: (conversationId) =>
    set((state) => {
      const updated = new Map(state.optimisticMessages)
      updated.delete(conversationId)
      return { optimisticMessages: updated }
    }),
}))

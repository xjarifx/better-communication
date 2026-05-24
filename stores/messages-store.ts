import { create } from "zustand"
import type { Message } from "@/types/message"

interface MessagesState {
  optimisticMessages: Map<string, Message[]>
  addOptimisticMessage: (conversationId: string, message: Message) => void
  removeOptimisticMessage: (conversationId: string, tempId: string) => void
  clearOptimisticMessages: (conversationId: string) => void
}

export const useMessagesStore = create<MessagesState>()((set) => ({
  optimisticMessages: new Map(),

  addOptimisticMessage: (conversationId, message) =>
    set((state) => {
      const updated = new Map(state.optimisticMessages)
      const current = updated.get(conversationId) ?? []
      updated.set(conversationId, [...current, message])
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

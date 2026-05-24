import { create } from "zustand"
import type { Message, SendMessagePayload } from "@/types/message"

export type MessageStatus = "pending" | "sending" | "failed" | "sent"

export interface QueuedMessage extends Message {
  status: MessageStatus
  retryCount: number
  failureReason?: string
  originalPayload: SendMessagePayload
  queuedAt: string
}

interface MessageQueueStore {
  queue: QueuedMessage[]
  isProcessing: boolean
  
  // Queue operations
  addToQueue: (message: QueuedMessage) => void
  removeFromQueue: (messageId: string) => void
  updateMessageStatus: (
    messageId: string,
    status: MessageStatus,
    failureReason?: string
  ) => void
  incrementRetryCount: (messageId: string) => void
  getQueuedMessage: (messageId: string) => QueuedMessage | undefined
  getConversationQueue: (conversationId: string) => QueuedMessage[]
  
  // Queue management
  clearQueue: () => void
  clearConversationQueue: (conversationId: string) => void
  setProcessing: (processing: boolean) => void
  
  // Persistence
  hydrate: () => void
}

const QUEUE_STORAGE_KEY = "message-queue"
const MAX_QUEUE_SIZE = 50
const MAX_RETRIES = 5

export const useMessageQueueStore = create<MessageQueueStore>()((set, get) => ({
  queue: [],
  isProcessing: false,

  addToQueue: (message) =>
    set((state) => {
      // Check if already in queue
      if (state.queue.some((m) => m.id === message.id)) {
        return state
      }

      const updated = [...state.queue, message]
      
      // Trim to max queue size (keep newest)
      if (updated.length > MAX_QUEUE_SIZE) {
        updated.splice(0, updated.length - MAX_QUEUE_SIZE)
      }

      // Persist to localStorage
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("[MessageQueueStore] Failed to persist queue:", error)
      }

      return { queue: updated }
    }),

  removeFromQueue: (messageId) =>
    set((state) => {
      const updated = state.queue.filter((m) => m.id !== messageId)
      
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("[MessageQueueStore] Failed to persist queue:", error)
      }

      return { queue: updated }
    }),

  updateMessageStatus: (messageId, status, failureReason) =>
    set((state) => {
      const updated = state.queue.map((m) =>
        m.id === messageId
          ? { ...m, status, failureReason: failureReason || m.failureReason }
          : m
      )

      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("[MessageQueueStore] Failed to persist queue:", error)
      }

      return { queue: updated }
    }),

  incrementRetryCount: (messageId) =>
    set((state) => {
      const updated = state.queue.map((m) =>
        m.id === messageId
          ? { ...m, retryCount: Math.min(m.retryCount + 1, MAX_RETRIES) }
          : m
      )

      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("[MessageQueueStore] Failed to persist queue:", error)
      }

      return { queue: updated }
    }),

  getQueuedMessage: (messageId) => {
    return get().queue.find((m) => m.id === messageId)
  },

  getConversationQueue: (conversationId) => {
    return get().queue.filter((m) => m.conversationId === conversationId)
  },

  clearQueue: () => {
    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY)
    } catch (error) {
      console.error("[MessageQueueStore] Failed to clear queue:", error)
    }
    set({ queue: [] })
  },

  clearConversationQueue: (conversationId) =>
    set((state) => {
      const updated = state.queue.filter((m) => m.conversationId !== conversationId)
      
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error("[MessageQueueStore] Failed to persist queue:", error)
      }

      return { queue: updated }
    }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  hydrate: () => {
    // Only run in browser
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        const queue = JSON.parse(stored) as QueuedMessage[]
        set({ queue })
        console.log(`[MessageQueueStore] Hydrated ${queue.length} messages from storage`)
      }
    } catch (error) {
      console.error("[MessageQueueStore] Failed to hydrate from storage:", error)
      set({ queue: [] })
    }
  },
}))

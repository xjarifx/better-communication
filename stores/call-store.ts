import { create } from "zustand"
import type { ActiveCall, IncomingCall } from "@/types/call"

interface ConversationCall {
  roomUrl: string
  roomName: string
}

interface CallState {
  activeCall: ActiveCall | null
  incomingCall: IncomingCall | null
  conversationCalls: Record<string, ConversationCall>
  setActiveCall: (call: ActiveCall | null) => void
  setIncomingCall: (call: IncomingCall | null) => void
  setConversationCall: (conversationId: string, call: ConversationCall) => void
  removeConversationCall: (conversationId: string) => void
  startCall: (call: ActiveCall) => void
  endCall: () => void
  acceptCall: () => void
  rejectCall: () => void
}

export const useCallStore = create<CallState>()((set) => ({
  activeCall: null,
  incomingCall: null,
  conversationCalls: {},

  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),

  setConversationCall: (conversationId, call) =>
    set((state) => ({
      conversationCalls: { ...state.conversationCalls, [conversationId]: call },
    })),

  removeConversationCall: (conversationId) =>
    set((state) => {
      const rest = { ...state.conversationCalls }
      delete rest[conversationId]
      return { conversationCalls: rest }
    }),

  startCall: (call) => set({ activeCall: call, incomingCall: null }),

  endCall: () => set({ activeCall: null }),

  acceptCall: () =>
    set((state) => {
      const incoming = state.incomingCall
      if (!incoming) return state
      return {
        activeCall: {
          conversationId: incoming.conversationId,
          roomUrl: incoming.roomUrl,
          roomName: incoming.roomUrl.split("/").pop() ?? "",
          startedAt: new Date().toISOString(),
        },
        incomingCall: null,
      }
    }),

  rejectCall: () => set({ incomingCall: null }),
}))

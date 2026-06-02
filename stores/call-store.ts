import { create } from "zustand"
import type { ActiveCall, IncomingCall } from "@/types/call"

interface CallState {
  activeCall: ActiveCall | null
  incomingCall: IncomingCall | null
  setActiveCall: (call: ActiveCall | null) => void
  setIncomingCall: (call: IncomingCall | null) => void
  startCall: (call: ActiveCall) => void
  endCall: () => void
  acceptCall: (callerId: string) => void
  rejectCall: () => void
}

export const useCallStore = create<CallState>()((set) => ({
  activeCall: null,
  incomingCall: null,

  setActiveCall: (activeCall) => set({ activeCall }),
  setIncomingCall: (incomingCall) => set({ incomingCall }),

  startCall: (call) => set({ activeCall: call, incomingCall: null }),

  endCall: () => set({ activeCall: null }),

  acceptCall: (callerId: string) =>
    set((state) => {
      const incoming = state.incomingCall
      if (!incoming) return state
      return {
        activeCall: {
          conversationId: incoming.conversationId,
          startedAt: new Date().toISOString(),
          callerId,
        },
        incomingCall: null,
      }
    }),

  rejectCall: () => set({ incomingCall: null }),
}))

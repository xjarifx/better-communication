import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Conversation, CreateConversationInput } from "@/types/conversation"
import { useAuthStore } from "@/stores/auth-store"
import { useSocketStore } from "@/stores/socket-store"

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => apiClient.get("/api/conversations"),
    staleTime: 1000 * 30,
  })
}

export function useConversation(id: string | null) {
  return useQuery<Conversation>({
    queryKey: ["conversations", id],
    queryFn: () => apiClient.get(`/api/conversations/${id}`),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const socketStore = useSocketStore.getState()

  return useMutation({
    mutationFn: (input: CreateConversationInput) =>
      apiClient.post<{ conversation: Conversation; isNew: boolean }>(
        "/api/conversations",
        input,
      ),

    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] })
      const socket = socketStore.socket
      if (socket) {
        socket.emit("conversation:join", {
          conversationId: data.conversation.id,
        })
      }
    },
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const socketStore = useSocketStore.getState()

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.delete(`/api/conversations/${conversationId}`),

    onSuccess: async (_data, conversationId) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] })
      const socket = socketStore.socket
      if (socket) {
        socket.emit("conversation:leave", { conversationId })
      }
    },
  })
}

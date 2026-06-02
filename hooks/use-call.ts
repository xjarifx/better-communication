import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

export function useCreateRoom() {
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.post<{ conversationId: string }>("/api/calls/rooms", { conversationId }),
  })
}

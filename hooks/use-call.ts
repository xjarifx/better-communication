import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { CallRoom, CallRoomStatus } from "@/types/call"

export function useCreateRoom() {
  return useMutation({
    mutationFn: (conversationId: string) =>
      apiClient.post<CallRoom>("/api/calls/rooms", { conversationId }),
  })
}

export function useGetRoom() {
  return useMutation({
    mutationFn: (roomName: string) =>
      apiClient.get<CallRoomStatus>(`/api/calls/rooms/${roomName}`),
  })
}

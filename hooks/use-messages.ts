import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  Message,
  MessagesResponse,
  SendMessagePayload,
  EditMessagePayload,
} from "@/types/message"
import { useMessagesStore } from "@/stores/messages-store"
import { useAuthStore } from "@/stores/auth-store"

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) =>
      apiClient.get(`/api/conversations/${conversationId}/messages`, {
        cursor: pageParam as string | null,
        limit: "50",
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null,
    enabled: !!conversationId,
    staleTime: 1000 * 10,
  })
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  const { addOptimisticMessage, removeOptimisticMessage } =
    useMessagesStore.getState()
  const user = useAuthStore.getState().user

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      apiClient.post<Message>(
        `/api/conversations/${conversationId}/messages`,
        payload,
      ),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] })

      const tempId = `temp-${crypto.randomUUID()}`
      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        sender: {
          id: user?.id ?? "",
          displayName: user?.displayName ?? "",
          avatarUrl: user?.avatarUrl ?? null,
        },
        type: payload.type ?? "TEXT",
        content: payload.content ?? null,
        fileUrl: payload.fileUrl ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
        fileName: payload.fileName ?? null,
        fileSize: payload.fileSize ?? null,
        createdAt: new Date().toISOString(),
      }

      addOptimisticMessage(conversationId, optimisticMessage)

      return { tempId }
    },

    onSuccess: (data, _variables, context) => {
      if (context) {
        removeOptimisticMessage(conversationId, context.tempId)
      }
      queryClient.setQueryData(
        ["messages", conversationId],
        (old: InfiniteData<MessagesResponse> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page, idx) =>
              idx === 0
                ? { ...page, messages: [data, ...page.messages] }
                : page,
            ),
          }
        },
      )
    },

    onError: (_error, _variables, context) => {
      if (context) {
        removeOptimisticMessage(conversationId, context.tempId)
      }
    },
  })
}

export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: { messageId: string; content: string }) =>
      apiClient.patch<Message>(`/api/messages/${messageId}`, { content }),

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["messages", data.conversationId],
        (old: InfiniteData<MessagesResponse> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === data.id ? data : m,
              ),
            })),
          }
        },
      )
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: string) =>
      apiClient.delete(`/api/messages/${messageId}`),

    onSuccess: (_data, messageId) => {
      queryClient.invalidateQueries({ queryKey: ["messages"] })
    },
  })
}

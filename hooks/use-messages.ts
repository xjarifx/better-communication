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
import { useSocketStore } from "@/stores/socket-store"
import { useMessageQueueStore, type QueuedMessage } from "@/stores/message-queue-store"
import { enqueueMessage, isAppOnline } from "@/lib/message-queue"

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

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      new Promise<Message>((resolve, reject) => {
        const user = useAuthStore.getState().user
        const { socket, isConnected } = useSocketStore.getState()
        const { removeFromQueue, updateMessageStatus } = useMessageQueueStore.getState()
        
        // Generate temp ID for this message
        const tempId = `temp-${crypto.randomUUID()}`

        // Check if we're online
        const online = isAppOnline()

        console.log(
          `[useSendMessage] Attempting to send message. Online: ${online}, SocketConnected: ${isConnected}`
        )

        // If offline, add to queue instead of sending
        if (!online) {
          console.log(`[useSendMessage] Offline - adding message to queue`)
          
          const queuedMessage: QueuedMessage = {
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
            status: "pending",
            retryCount: 0,
            originalPayload: payload,
            queuedAt: new Date().toISOString(),
          }

          enqueueMessage(queuedMessage)
          
          resolve({
            id: tempId,
            conversationId,
            sender: queuedMessage.sender,
            type: payload.type ?? "TEXT",
            content: payload.content ?? null,
            fileUrl: payload.fileUrl ?? null,
            thumbnailUrl: payload.thumbnailUrl ?? null,
            fileName: payload.fileName ?? null,
            fileSize: payload.fileSize ?? null,
            createdAt: new Date().toISOString(),
          })
          return
        }

        // Try to send via socket
        let retries = 0
        const maxRetries = 50 // 5 seconds total (50 * 100ms)
        
        const attemptSend = () => {
          // Get socket at each attempt
          const { socket: currentSocket, isConnected: currentlyConnected } =
            useSocketStore.getState()
          
          console.log(
            `[useSendMessage] Attempt ${retries + 1}: Socket connected: ${currentlyConnected}`
          )
          
          if (!currentSocket || !currentlyConnected) {
            if (retries < maxRetries) {
              retries++
              setTimeout(attemptSend, 100)
              return
            } else {
              console.warn(`[useSendMessage] Socket not connected after ${maxRetries} retries`)
              
              // If socket fails, add to queue for later retry
              console.log(
                `[useSendMessage] Failed to send via socket - adding to queue for retry`
              )
              
              const queuedMessage: QueuedMessage = {
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
                status: "pending",
                retryCount: 0,
                originalPayload: payload,
                queuedAt: new Date().toISOString(),
              }

              enqueueMessage(queuedMessage)
              
              resolve({
                id: tempId,
                conversationId,
                sender: queuedMessage.sender,
                type: payload.type ?? "TEXT",
                content: payload.content ?? null,
                fileUrl: payload.fileUrl ?? null,
                thumbnailUrl: payload.thumbnailUrl ?? null,
                fileName: payload.fileName ?? null,
                fileSize: payload.fileSize ?? null,
                createdAt: new Date().toISOString(),
              })
              return
            }
          }

          console.log(
            `[useSendMessage] Emitting message:send to conversation ${conversationId}`
          )
          currentSocket.emit(
            "message:send",
            {
              conversationId,
              type: payload.type ?? "TEXT",
              content: payload.content ?? null,
              fileUrl: payload.fileUrl ?? null,
              thumbnailUrl: payload.thumbnailUrl ?? null,
              fileName: payload.fileName ?? null,
              fileSize: payload.fileSize ?? null,
            },
            (response: { status: string; messageId?: string; error?: string }) => {
              console.log(`[useSendMessage] Received ack response:`, response)
              if (response.status === "error") {
                reject(new Error(response.error ?? "Failed to send message"))
              } else {
                resolve({
                  id: response.messageId ?? tempId,
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
                })
              }
            }
          )
        }
        
        attemptSend()
      }),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] })

      const { addOptimisticMessage } = useMessagesStore.getState()
      const user = useAuthStore.getState().user

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
      const { removeOptimisticMessage } = useMessagesStore.getState()
      const { removeFromQueue } = useMessageQueueStore.getState()
      
      // Remove from queue if it was queued
      if (context?.tempId) {
        removeFromQueue(context.tempId)
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
      const { removeOptimisticMessage } = useMessagesStore.getState()
      
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

"use client"

import { useState, useEffect } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { createQueryClient } from "@/lib/query-client"
import { useAuthStore } from "@/stores/auth-store"
import { initSocket, disconnectSocket } from "@/lib/socket-client"
import { useSocketStore } from "@/stores/socket-store"
import { useMessagesStore } from "@/stores/messages-store"
import { useCallStore } from "@/stores/call-store"
import { useConversations } from "@/hooks/use-conversations"
import type { Message } from "@/types/message"
import type { IncomingCall } from "@/types/call"

let queryClient: ReturnType<typeof createQueryClient> | null = null

function getQueryClient() {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient)

  return (
    <QueryClientProvider client={client}>
      <SocketHandler />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function SocketHandler() {
  const { accessToken } = useAuthStore()
  const { data: conversations } = useConversations()

  console.log(`[SocketHandler] Rendering. accessToken: ${accessToken ? "present" : "missing"}, conversations: ${conversations?.length ?? 0}`)

  useEffect(() => {
    if (!accessToken) {
      console.log(`[SocketHandler] No access token, skipping socket setup`)
      disconnectSocket()
      useSocketStore.getState().setSocket(null)
      useSocketStore.getState().setConnected(false)
      return
    }

    console.log(`[SocketHandler] Setting up socket with token`)
    const socket = initSocket(accessToken)
    useSocketStore.getState().setSocket(socket)
    const queryClient = getQueryClient()

    socket.on("connect", () => {
      console.log(`[SocketHandler] Socket connected, joining conversations`)
      useSocketStore.getState().setConnected(true)
      // Join all conversation rooms when socket connects
      if (conversations && conversations.length > 0) {
        console.log(`[SocketHandler] Emitting join:conversations for ${conversations.length} conversations`)
        socket.emit("join:conversations", {
          conversationIds: conversations.map((c) => c.id),
        })
      } else {
        console.log(`[SocketHandler] No conversations to join`)
      }
    })

    socket.on("disconnect", () => {
      useSocketStore.getState().setConnected(false)
    })

    socket.on("conversation:new", (data: { conversationId: string; createdBy: string }) => {
      // When a new conversation is created by another user, invalidate conversations cache
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    socket.on("message:new", (message: Message) => {
      console.log(`[SocketHandler] Received message:new event for message ${message.id}`)
      queryClient.setQueryData(["messages", message.conversationId], (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any, idx: number) =>
            idx === 0
              ? { ...page, messages: [message, ...page.messages] }
              : page,
          ),
        }
      })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    socket.on("message:updated", (message: Message) => {
      queryClient.setQueryData(["messages", message.conversationId], (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.map((m: Message) =>
              m.id === message.id ? message : m,
            ),
          })),
        }
      })
    })

    socket.on("message:deleted", (data: { messageId: string; conversationId: string }) => {
      queryClient.setQueryData(["messages", data.conversationId], (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: page.messages.filter((m: Message) => m.id !== data.messageId),
          })),
        }
      })
    })

    socket.on("user:typing", (data: { userId: string; conversationId: string }) => {
      useSocketStore.getState().addTypingUser(data.conversationId, data.userId)
    })

    socket.on("user:stop-typing", (data: { userId: string; conversationId: string }) => {
      useSocketStore.getState().removeTypingUser(data.conversationId, data.userId)
    })

    socket.on("call:incoming", (call: IncomingCall) => {
      useCallStore.getState().setIncomingCall(call)
    })

    socket.on("call:ended", (data: { conversationId: string }) => {
      const activeCall = useCallStore.getState().activeCall
      if (activeCall?.conversationId === data.conversationId) {
        useCallStore.getState().endCall()
      }
    })

    socket.on("user:online", (data: { userId: string; online: boolean }) => {
      useSocketStore.getState().setOnlineUser(data.userId, data.online)
    })

    console.log(`[SocketHandler] All event listeners registered`)

    return () => {
      console.log(`[SocketHandler] Cleaning up socket`)
      socket.disconnect()
      useSocketStore.getState().setSocket(null)
    }
  }, [accessToken, conversations])

  return null
}

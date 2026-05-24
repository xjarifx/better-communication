export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE"

export interface MessageSender {
  id: string
  displayName: string
  avatarUrl: string | null
}

export interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  type: MessageType
  content: string | null
  fileUrl: string | null
  thumbnailUrl: string | null
  fileName: string | null
  fileSize: number | null
  createdAt: string
}

export interface MessagesResponse {
  messages: Message[]
  nextCursor: string | null
}

export interface SendMessagePayload {
  type: MessageType
  content?: string
  fileUrl?: string
  thumbnailUrl?: string
  fileName?: string
  fileSize?: number
}

export interface EditMessagePayload {
  content: string
}

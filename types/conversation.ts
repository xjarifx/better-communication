export type ConversationType = "DIRECT" | "GROUP"

export interface ConversationMember {
  id: string
  displayName: string
  avatarUrl: string | null
}

export interface Conversation {
  id: string
  type: ConversationType
  name: string | null
  members: ConversationMember[]
  lastMessage: { id: string; content: string | null; senderId: string; createdAt: string } | null
  updatedAt: string
}

export interface CreateConversationInput {
  type: ConversationType
  name?: string
  memberIds: string[]
}

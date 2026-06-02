import type { Message } from "./message"
import type { IncomingCall } from "./call"

export interface ClientToServerEvents {
  "join:conversations": { conversationIds: string[] }
  "conversation:join": { conversationId: string }
  "conversation:leave": { conversationId: string }
  "message:send": {
    conversationId: string
    type: string
    content?: string
    fileUrl?: string
    thumbnailUrl?: string
    fileName?: string
    fileSize?: number
  }
  "message:edit": { messageId: string; content: string }
  "message:delete": { messageId: string }
  "user:typing": { conversationId: string }
  "user:stop-typing": { conversationId: string }
  "call:start": { conversationId: string }
  "call:end": { conversationId: string }
  "webrtc:offer": { conversationId: string; sdp: string }
  "webrtc:answer": { conversationId: string; sdp: string }
  "webrtc:ice-candidate": { conversationId: string; candidate: RTCIceCandidateInit }
  "webrtc:ready": { conversationId: string }
}

export interface ServerToClientEvents {
  "user:online": { userId: string; online: boolean }
  "message:new": Message
  "message:updated": Message
  "message:deleted": { messageId: string; conversationId: string }
  "user:typing": { userId: string; conversationId: string }
  "user:stop-typing": { userId: string; conversationId: string }
  "call:incoming": IncomingCall
  "call:ended": { conversationId: string }
  "webrtc:offer": { conversationId: string; sdp: string }
  "webrtc:answer": { conversationId: string; sdp: string }
  "webrtc:ice-candidate": { conversationId: string; candidate: RTCIceCandidateInit }
  "webrtc:ready": { conversationId: string }
}

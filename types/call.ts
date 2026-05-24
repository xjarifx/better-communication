export interface CallRoom {
  roomUrl: string
  roomName: string
}

export interface CallRoomStatus {
  roomUrl: string
  roomName: string
  active: boolean
}

export interface IncomingCall {
  conversationId: string
  roomUrl: string
  callerId: string
}

export interface ActiveCall {
  conversationId: string
  roomUrl: string
  roomName: string
  startedAt: string
}

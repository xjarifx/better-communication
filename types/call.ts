export interface IncomingCall {
  conversationId: string
  callerId: string
}

export interface ActiveCall {
  conversationId: string
  startedAt: string
  callerId: string
}

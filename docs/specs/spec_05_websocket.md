# Specification 05: Real-Time WebSocket Engine

This document specifies the real-time communications channel, heartbeat protocol, payload signatures, and room synchronization states.

---

## 1. Protocol Connection Parameters

- **URL Protocol Scheme**: Native WebSockets (`ws://` or `wss://`).
- **Connection Gateway**: `/ws?token=<accessToken>`
- **Authentication**: Ephemeral validation executed during upgrade handshake.
- **Failures**: Close with Code `4001` (Unauthorized) for missing or invalid tokens.

---

## 2. Heartbeat Verification (Ping/Pong)

To bypass load balancer connection drops, detect browser sleep/wake cycles, and clean up inactive TCP sockets, a regular client-driven heartbeat protocol is enforced:

```
[WebSocket Client]                                              [WebSocket Server]
        │                                                              │
        ├───────── Ping: {"type": "ping"} ────────────────────────────►│
        │◄──────── Pong: {"type": "pong"} ─────────────────────────────┤ (Immediate echo)
        │                                                              │
```

- **Ping Frequency**: Client broadcasts `{"type":"ping"}` every **25 seconds**.
- **Pong Response**: Server echoes `{"type":"pong"}` immediately.
- **Connection Pruning**: If the client doesn't receive a `pong` response, or the server receives no `ping` for **50 seconds**, the connection is marked dead, disconnected, and the automatic reconnection flow begins.

---

## 3. Client-to-Server Event catalog

Clients serialize and send events using structured JSON schemas:

### 1. `subscribe` (Room Association)
* **Rationale**: Joins the subscription channel for a specific conversation.
* **Payload**:
  ```json
  {
    "type": "subscribe",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a"
  }
  ```

### 2. `message` (Immediate Text Injection)
* **Rationale**: Direct injection of text messages. Reduces HTTP request overhead for typing-only feeds.
* **Payload**:
  ```json
  {
    "type": "message",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "tempId": "opt-uuid-12345",
    "content": "Hey team, check this out!"
  }
  ```

### 3. `typing` (Typing Status)
* **Rationale**: Updates typing status. Must be throttled on the client to send every 2 seconds.
* **Payload**:
  ```json
  {
    "type": "typing",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "isTyping": true
  }
  ```

### 4. `call_offer` (WebRTC P2P Handshake)
* **Rationale**: Starts a 1:1 calling connection by sending an SDP offer to a specific user.
* **Payload**:
  ```json
  {
    "type": "call_offer",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "targetUserId": "b3f88219-c035-430b-93ae-c98f5aee933a",
    "sdp": "v=0\r\no=- 42163 2 IN IP4 127.0.0.1..."
  }
  ```

### 5. `ice_candidate` (WebRTC Network Negotiation)
* **Rationale**: Shares connection path credentials between browsers.
* **Payload**:
  ```json
  {
    "type": "ice_candidate",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "targetUserId": "b3f88219-c035-430b-93ae-c98f5aee933a",
    "candidate": {
      "candidate": "candidate:842163 1 UDP 16777215 192.168.1.50 51432...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
  ```

---

## 4. Server-to-Client Broadcast catalog

### 1. `message` (Receive Message)
* **Payload**:
  ```json
  {
    "type": "message",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "tempId": "opt-uuid-12345",
    "message": {
      "id": "ca8d3e21-0a25-4c07-88eb-10900bb4a9ee",
      "senderId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
      "type": "TEXT",
      "content": "Hey team, check this out!",
      "createdAt": "2026-05-20T16:22:00Z"
    }
  }
  ```

### 2. `typing` (Typing Status)
* **Payload**:
  ```json
  {
    "type": "typing",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "userId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
    "isTyping": true
  }
  ```

### 3. `presence` (Global Presence Update)
* **Payload**:
  ```json
  {
    "type": "presence",
    "userId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
    "status": "online" // "online" | "offline"
  }
  ```

### 4. `call_incoming` (Incoming 1:1 Calling Alert)
* **Payload**:
  ```json
  {
    "type": "call_incoming",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "callerId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee"
  }
  ```

### 5. `group_call_incoming` (Incoming Daily.co Calling Alert)
* **Payload**:
  ```json
  {
    "type": "group_call_incoming",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "callerId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
    "roomUrl": "https://bettercomm.daily.co/chat-room-7ac984e1"
  }
  ```

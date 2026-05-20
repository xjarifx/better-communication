# Specification 08: State Management & Real-Time Sync

This document specifies client-side optimistic UI state loops, multi-tab active presence registries, unread indicators, read receipt updates, and cursor-based message pagination.

---

## 1. Client-Side Optimistic UI State Loops

To deliver a snappy, responsive messaging experience, Better-Communication processes message sending optimistically in the UI before confirming database persistence.

```
 [User types and hits Send]
              │
              ▼
  (1) Add Optimistic Message to React State
      { id: "temp-uuid", status: "sending", ... }
              │
              ├─────────────────────────────────────────────────┐
              ▼ (Async HTTP/WS Send)                            ▼ (5-second timeout trigger)
  [Send Payload to Server]                              [Wait 5 seconds]
              │                                                 │
              ▼ (Server confirmation received)                  ▼ (No confirmation received)
  (2) Replace "temp-uuid" with Server Record            (3) Update state: set status to "failed"
      Mark status as "sent" (null)                          Show Retry Button
```

### Flow Details:
1. **Instantiation**: The moment a user submits a message, the client generates a temporary UUID and immediately pushes a placeholder message into the active conversation state:
   ```typescript
   const optimisticMessage: Message = {
     id: `temp-${uuid()}`,
     content: textContent,
     senderId: currentUserId,
     createdAt: new Date().toISOString(),
     status: 'sending' // 'sending' | 'sent' | 'failed'
   };
   ```
2. **Reconciliation Loop**:
   - The application client maintains a map of active temporary message keys: `Map<string, boolean>`.
   - When the server broadcasts the saved message through WebSockets with a matching `tempId`:
     - Swap the placeholder `tempMessage` in state with the fully validated server-stamped message, and set `status` to `null` (confirmed).
3. **Timeout & Failure Handling**:
   - A 5-second countdown timer is set for each optimistic message.
   - If the server doesn't respond or confirm receipt before the timer expires:
     - The message status updates to `'failed'` in the React state.
     - The UI displays a warning indicator alongside a "Retry" button. On press, the client resends the payload and restarts the retry timer.

---

## 2. Dynamic Presence Tracking & Multi-Tab Aggregation

Because users can have multiple active browser tabs open concurrently, presence cannot be determined by a single connect/disconnect event. We track active connections per user:

1. **Connection Registry**:
   - The WebSocket server maintains an in-memory dictionary tracking all active connections per user ID:
     `Map<string, Set<WebSocket>>` (User ID mapping to a Set of active WebSocket instances).
2. **State Updates**:
   - **User Comes Online**: When a new socket connection is established, add it to the user’s connection set. If the set size changes from `0` to `1`, broadcast a `presence` update (`status: online`) to all active conversation rooms the user belongs to.
   - **User Goes Offline**: When a socket connection drops, remove it from the user’s set. If the set size drops to `0`, wait for a **2-second grace period** (to prevent offline alerts during page refreshes or quick network drops). If no new connection is established, broadcast a `presence` update (`status: offline`).

---

## 3. Unread Indicators & Read Receipts

1. **Member Tracking (`lastReadAt`)**:
   - When a user opens a conversation, the client sends a `POST /api/conversations/:id/read` update to record the timestamp in the database (`lastReadAt` column on the user's `ConversationMember` record).
2. **UI indicators**:
   - **Double checkmark**: A double checkmark appears next to sent messages when the recipient's `lastReadAt` timestamp is greater than or equal to the message's `createdAt` timestamp.
   - **Unread counts**: For the conversation sidebar list, unread counts are calculated by querying the database for all messages in the channel where `createdAt` > `lastReadAt` for the logged-in user.

---

## 4. Cursor-Based pagination

To ensure consistent database query speeds and avoid the page-shifting issues common with offset pagination as new messages arrive, the system uses strict cursor-based pagination.

- **Request Query**:
  `GET /api/conversations/:id/messages?before={messageUuid}&limit=50`
- **Database Query**:
  Queries the database for messages where `conversationId` matches, filtered by `createdAt < cursor.createdAt`, sorted descending, and limited to `limit + 1`.
- **Response**:
  Returns the page of messages and sets `nextCursor` to the ID of the oldest message retrieved, which the client uses to fetch the next page.

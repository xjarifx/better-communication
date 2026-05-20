# Specification 09: Build Order & Verification Matrix

This specification outlines the execution roadmap, automated testing setups, manual network throttling configurations, and the QA matrix.

---

## 1. Step-by-Step Build Order

We follow a linear, bottom-up implementation strategy to ensure each layer is thoroughly tested before building the next:

1. **Phase 1: Database Setup**
   - Scaffolding the PostgreSQL schema models inside `schema.prisma`.
   - Running Prisma migrations (`npx prisma migrate dev`) to build the database tables and indexes.
2. **Phase 2: Authentication API Engine**
   - Implementing user registration, login, logout, and token refresh API routes.
   - Setting up authorization middleware to validate JWT access tokens on protected endpoints.
3. **Phase 3: Real-Time WebSocket server**
   - Scaffolding the WebSocket connection gateway.
   - Setting up token parsing and validation during the upgrade handshake.
   - Implementing client subscription rooms and bi-directional message routing.
4. **Phase 4: Message Feed REST APIs**
   - Creating `/api/conversations` (list and create).
   - Implementing `/api/conversations/:id/messages` (cursor-based pagination).
5. **Phase 5: Client-Side Foundations (Next.js)**
   - Designing the global styling system, HSL color tokens, and custom glassmorphism panels.
   - Implementing the side navigation menu, chat window, and authentication flows.
   - Setting up the client-side WebSocket client with heartbeat mechanisms and auto-reconnection.
6. **Phase 6: ImageKit Cloud Integration**
   - Creating `/api/auth/imagekit` to generate secure upload signatures.
   - Building client-side uploading to send media directly to ImageKit's API.
   - Setting up real-time URL image transformations (thumbnails, smart cropping).
7. **Phase 7: WebRTC Direct & Daily.co Group Calling**
   - Building WebRTC 1:1 calling interfaces and peer signaling connections.
   - Setting up Daily.co endpoints to provision and join group rooms.

---

## 2. Automated Verification Strategy

### 1. Database Integration Testing (Jest + Prisma Mock)
- **Database Seed Validation**: Seed the database and verify that relations cascade correctly. For example, deleting a conversation must automatically delete its messages.
- **Index Performance Evaluation**: Populate the database with 50,000 mock messages in a conversation. Query using cursor filters (`before=<messageId>`) to confirm the query executes in **under 20ms** by utilizing the `@@index([conversationId, createdAt(sort: Desc)])` index.

### 2. End-to-End Real-Time Testing (Playwright)
- **Real-Time Delivery Test**: Launch two separate Playwright browser contexts:
  - Context A authenticates as User A, joins a room, and types a message.
  - Context B authenticates as User B, joins the same room, and verifies that the message appears in the chat feed **under 150ms** without requiring a page refresh.
- **Token Security Test**: Confirm that attempting to access a protected API route (e.g., `/api/conversations`) without a valid JWT access token returns `401 Unauthorized`.
- **Token Rotation Test**: Mock a stolen refresh token reuse scenario. Verify that the server detects the reuse, deletes all active refresh tokens for the user in the database, clears the user's cookies, and returns `403 Forbidden`.

---

## 3. Manual QA Verification Matrix

### 1. Network Disruption & Offline Reconnection
- **Test Setup**:
  1. Open the application, open Chrome DevTools, navigate to the Network panel, and set throttling to **Offline**.
  2. Type and send a message. Verify that it appears in the chat immediately with a **sending** indicator.
  3. Verify that after 5 seconds of no server response, the message status updates to **failed** and displays a **Retry** option.
  4. Restore the network connection. Confirm the client-side WebSocket automatically reconnects, re-subscribes, and successful retries send the message.

### 2. High Payload Rejection
- **Test Setup**:
  1. Open a direct chat window and attempt to upload a **120MB file** (exceeding the 100MB general limit).
  2. Verify that the client-side validation catches the size limit before uploading, showing a clear, helpful warning in the UI, and never starts the ImageKit upload.

### 3. Multi-Tab Presence Aggregation
- **Test Setup**:
  1. Open the application across **three separate tabs** logged into the same user account.
  2. Observe a second user account's view. Confirm that your status shows as **online**.
  3. Close two of your active tabs. Confirm that your status remains **online**.
  4. Close the final tab. Verify that after a **2-second grace period**, your status changes to **offline** in the second user account's view.

# Better Communication — Technical Specification & Implementation Plan

| Document | |
|---|---|
| Status | **Draft** |
| Author | Engineering Team |
| Version | 1.0 |
| Last Updated | 2026-05-23 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Glossary](#2-glossary)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Architecture Decision Records](#5-architecture-decision-records)
6. [Data Model](#6-data-model)
7. [API Specification](#7-api-specification)
8. [WebSocket Protocol](#8-websocket-protocol)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Data Flow Sequences](#10-data-flow-sequences)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Project Structure](#12-project-structure)
13. [Implementation Phases](#13-implementation-phases)
14. [Risk Register](#14-risk-register)
15. [Non-Goals & Future Considerations](#15-non-goals--future-considerations)

---

## 1. Executive Summary

**Better Communication** is a real-time messaging and video calling application supporting both 1:1 (direct) and N:N (group) conversations. This document serves as the technical specification for the Minimum Viable Product (MVP) — the smallest feature set that delivers core value to users.

**MVP Success Criteria:**
- A user can register and authenticate
- A user can create and join conversations (1:1 and group)
- Messages deliver in real time
- Users can initiate and participate in video calls within a conversation
- Files (images) can be shared in messages

---

## 2. Glossary

| Term | Definition |
|---|---|
| **Access Token** | Short-lived JWT (15 min) sent as `Authorization: Bearer` header |
| **Conversation** | A chat session between 2+ users; can be DIRECT (1:1) or GROUP (N:N) |
| **Daily.co** | Third-party video API; provides room-based video calls via pre-built UI |
| **ImageKit** | Third-party media optimization & upload service; handles image resizing, thumbnails |
| **MVP** | Minimum Viable Product — smallest feature set that provides value and enables feedback |
| **Neon** | Serverless PostgreSQL provider with connection pooling |
| **Prisma** | Type-safe ORM for database access; generates TypeScript types from schema |
| **Room (Socket.IO)** | Server-side channel; users in the same room receive each other's events |
| **Room (Daily.co)** | Virtual video call space identified by a URL; participants join via browser |
| **Zod** | Runtime schema validation library; infers TypeScript types from validation schemas |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
 │                            Client (Browser)                             │
 │                                                                         │
 │  ┌──────────────────────────────────────────────────────────────────┐   │
 │  │                   Next.js Application (SSR + CSR)                │   │
 │  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   │   │
 │  │  │ Auth UI │  │ Chat UI │  │ Call UI  │  │ Socket.IO Client │   │   │
 │  │  └────┬────┘  └────┬────┘  └────┬─────┘  └────────┬─────────┘   │   │
 │  └───────┼────────────┼────────────┼──────────────────┼─────────────┘   │
 │          │            │            │                  │                  │
 └──────────┼────────────┼────────────┼──────────────────┼──────────────────┘
            │            │            │                  │
            │   HTTPS    │   HTTPS    │   HTTPS          │   WSS (WebSocket)
            ▼            ▼            ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
 │                              DMZ / Load Balancer                        │
 │                                                                         │
 │  ┌────────────────────────┐  ┌───────────────────────────────────┐     │
 │  │   Next.js Server       │  │   Socket.IO Server (Port 3001)    │     │
 │  │   (Port 3000)          │  │   - Persistent connections        │     │
 │  │   - HTTP API           │  │   - JWT verification              │     │
 │  │   - SSR                │  │   - Room management               │     │
 │  │   - Static assets      │  │   - Event routing                 │     │
 │  └───────────┬────────────┘  └────────────────┬──────────────────┘     │
 └──────────────┼────────────────────────────────┼────────────────────────┘
                │                                │
                └────────────────┬───────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     PostgreSQL (Neon)    │
                    │     - users              │
                    │     - conversations      │
                    │     - messages           │
                    │     - memberships        │
                    └─────────────────────────┘

External Services:
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   Daily.co     │    │   ImageKit     │    │   JWT Secret   │
│ Video API      │    │ Media Upload   │    │ (application)  │
└────────────────┘    └────────────────┘    └────────────────┘
```

### 3.2 Request Lifecycle

```
HTTP Request (e.g., POST /api/auth/login)
  │
  ▼
Next.js App Router
  ├── Route Handler (route.ts)
  │     ├── Parse body (request.json())
  │     ├── Validate with Zod schema (safeParse)
  │     ├── Call service layer (business logic)
  │     │     ├── Check business rules (e.g., email exists)
  │     │     ├── Call repository layer (Prisma query)
  │     │     └── Return result
  │     └── Return HTTP response
  │
WebSocket Event (e.g., message:send)
  │
  ▼
Socket.IO Server
  ├── Verify JWT from handshake auth
  ├── Route to handler
  │     ├── Validate payload
  │     ├── Persist to database
  │     ├── Broadcast to room
  │     └── Emit acknowledgment
  └── Error handling middleware
```

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | ≥20 | JavaScript runtime |
| **Web Framework** | Next.js | 16.2.6 | App Router, API routes, SSR |
| **Language** | TypeScript | 5.x | Type safety across the stack |
| **Database** | PostgreSQL (Neon) | — | Relational data store |
| **ORM** | Prisma | 7.8.0 | Type-safe database access |
| **Auth** | jsonwebtoken (JWT) | 9.x | Bearer token authentication |
| **Validation** | Zod | 4.x | Runtime input validation |
| **Real-time** | Socket.IO | 4.x | Bidirectional event-based communication |
| **Video** | Daily.co | — | Room-based video calling |
| **Media** | ImageKit | — | Image upload, optimization, thumbnails |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **Password** | bcrypt | 6.x | Password hashing |

### 4.1 Development Dependencies

| Package | Purpose |
|---|---|
| `prettier` + `prettier-plugin-tailwindcss` | Code formatting |
| `eslint` + `eslint-config-next` | Linting |
| `prisma` | Schema migrations, client generation |
| `dotenv` | Local environment variables |
| `concurrently` (recommended) | Run Next.js + Socket.IO together |

### 4.2 Environment Variables

```
# Database
DATABASE_URL          PostgreSQL connection string (Neon)

# Auth
ACCESS_TOKEN_SECRET     HMAC secret for signing JWTs
ACCESS_TOKEN_EXPIRES_IN Token lifetime (e.g., "15m")

# Media (ImageKit)
IMAGEKIT_PUBLIC_KEY
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT

# Video (Daily.co)
DAILY_API_KEY

# Runtime
NODE_ENV              "development" | "production" | "test"
```

---

## 5. Architecture Decision Records

### ADR-001: Separate Socket.IO Server

| Field | Value |
|---|---|
| **Context** | Need real-time bidirectional communication |
| **Decision** | Run Socket.IO as a standalone process, not embedded in Next.js |
| **Rationale** | Next.js API routes are serverless functions — they boot per-request and cannot hold persistent TCP connections. Socket.IO requires a long-running process with in-memory state (connected clients, rooms). |
| **Consequence** | Must manage two processes in development; need a proxy or different port |
| **Alternative** | Embedding Socket.IO in a Next.js custom server (`server.ts`) — rejected because it bypasses App Router optimizations |

### ADR-002: JWT-Only Auth (No Refresh Tokens)

| Field | Value |
|---|---|
| **Context** | Need to authenticate API requests and WebSocket connections |
| **Decision** | Issue short-lived JWTs (15 min) without refresh tokens |
| **Rationale** | Eliminates refresh token storage/rotation complexity. Acceptable for an MVP — on token expiry, the user re-authenticates. Reduces database load (no refresh token table to query). |
| **Consequence** | Users may need to log in more frequently; can add refresh tokens post-MVP if UX becomes a problem |
| **Alternative** | OAuth2 with refresh tokens — more standard but over-engineered for MVP |

### ADR-003: Daily.co Pre-built UI for Video

| Field | Value |
|---|---|
| **Context** | Need video calling capability |
| **Decision** | Use Daily.co pre-built UI components instead of raw WebRTC |
| **Rationale** | WebRTC requires STUN/TURN server management, signaling, ICE negotiation, and complex state management. Daily.co abstracts all of this. Pre-built UI provides camera/mic controls, screen sharing, participant grid in under 100 lines of React code. |
| **Consequence** | Vendor lock-in; external API dependency. Acceptable for MVP — can migrate to custom WebRTC later if needed |

### ADR-004: Cursor-Based Pagination for Messages

| Field | Value |
|---|---|
| **Context** | Need to paginate potentially thousands of messages per conversation |
| **Decision** | Use cursor-based (keyset) pagination over offset-based |
| **Rationale** | Offset pagination becomes unstable when new rows are inserted (duplicates, skips). Cursor pagination uses `WHERE createdAt < :cursor` — stable even with concurrent inserts, and indexes efficiently. |
| **Consequence** | Slightly more complex query logic; no "page 2" semantics (only "load more") |

---

## 6. Data Model

### 6.1 Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────────────┐
│     User     │       │  ConversationMember   │
│──────────────│       │──────────────────────│
│ id (PK)      │──┐    │ conversationId (PK)  │──┐
│ email (UQ)   │  │    │ userId (PK)          │  │
│ passwordHash │  │    │ joinedAt             │  │
│ displayName  │  │    │ lastReadAt           │  │
│ avatarUrl?   │  │    └──────────┬───────────┘  │
│ createdAt    │  │               │              │
│ updatedAt    │  │               │              │
└──────────────┘  │               │              │
                  │    ┌──────────▼───────────┐  │
                  │    │    Conversation       │  │
                  └────┤──────────────────────│──┘
                       │ id (PK)              │
                       │ type (DIRECT|GROUP)   │
                       │ name?                │
                       │ createdAt            │
                       │ updatedAt            │
                       └──────────┬───────────┘
                                  │
                     ┌────────────▼────────────┐
                     │        Message           │
                     │─────────────────────────│
                     │ id (PK)                 │
                     │ conversationId (FK)     │
                     │ senderId (FK)           │
                     │ type (TEXT|IMAGE|...)   │
                     │ content?                │
                     │ fileUrl?                │
                     │ thumbnailUrl?           │
                     │ fileName?               │
                     │ fileSize?               │
                     │ createdAt               │
                     └─────────────────────────┘
```

### 6.2 Current Schema

The following models are already defined in `prisma/schema.prisma`:

**User** — `id`, `email` (unique), `passwordHash`, `displayName`, `avatarUrl?`, `createdAt`, `updatedAt`

**Conversation** — `id`, `type` (ConversationType: DIRECT | GROUP), `name?`, `createdAt`, `updatedAt`

**ConversationMember** — composite PK `(conversationId, userId)`, `joinedAt`, `lastReadAt`

**Message** — `id`, `conversationId` (FK), `senderId` (FK), `type` (MessageType: TEXT | IMAGE | VIDEO | FILE), `content?`, `fileUrl?`, `thumbnailUrl?`, `fileName?`, `fileSize?`, `createdAt`

### 6.3 Future-Proofing Fields

Added when needed (not required for initial schema):
- `Message.replyToId?: String` — references another message for reply chains
- `Message.editedAt?: DateTime` — tracks edits; null means never edited
- `ConversationMember.role?: String` — "admin" / "member" for group management

---

## 7. API Specification

### 7.1 Base URL

All endpoints are prefixed under the application domain (e.g., `http://localhost:3000`).

### 7.2 Authentication

```
Authorization: Bearer <access_token>
```

Protected endpoints return `401 Unauthorized` when the token is missing or expired.

### 7.3 Common Error Response Shape

```typescript
{
  error: string;          // Machine-readable error key
  details?: unknown[];    // Optional validation details
}
```

### 7.4 Auth Endpoints

#### `POST /api/auth/register`

Creates a new user account.

**Request Body:**
```typescript
{
  email: string;          // Valid email format
  password: string;       // 8-128 characters
  displayName: string;    // 1-50 characters
}
```

**Success Response** `201 Created`:
```typescript
{
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  accessToken: string;    // JWT, expires in 15m
}
```

**Error Responses:**
- `400` — Validation failed (malformed input)
- `409` — Email already in use

#### `POST /api/auth/login`

Authenticates an existing user.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Success Response** `200 OK`:
```typescript
{
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  accessToken: string;
}
```

**Error Responses:**
- `400` — Validation failed
- `401` — Invalid email or password

### 7.5 Conversation Endpoints

#### `GET /api/conversations`

Lists all conversations the authenticated user belongs to.

**Query Parameters:** (none for MVP)

**Response** `200 OK`:
```typescript
ConversationSummary[];    // Ordered by most recent activity
```

```typescript
interface ConversationSummary {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  members: { id: string; displayName: string; avatarUrl: string | null }[];
  lastMessage: {
    content: string | null;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}
```

#### `POST /api/conversations`

Creates a new conversation.

**Request Body:**
```typescript
{
  type: "DIRECT" | "GROUP";
  name?: string;          // Required for GROUP conversations
  memberIds: string[];    // User IDs of participants (excluding self)
}
```

**Response** `201 Created`: The full `Conversation` object with members.

**Validation Rules:**
- DIRECT conversations: `memberIds.length === 1`
- GROUP conversations: `memberIds.length >= 1`, `name` is required
- Duplicate conversation detection: if a DIRECT conversation between the same two users exists, return it instead of creating a new one

#### `GET /api/conversations/:id`

Returns conversation details with full member list.

**Response** `200 OK`: Full conversation object.

**Errors:** `403` if user is not a member, `404` if not found.

#### `DELETE /api/conversations/:id`

Deletes a conversation (soft or hard). Available only to conversation members.

**Response** `204 No Content`.

### 7.6 Message Endpoints

#### `GET /api/conversations/:id/messages`

Fetches paginated messages for a conversation.

**Query Parameters:**
```typescript
{
  cursor?: string;    // ISO timestamp of the oldest loaded message
  limit?: number;     // 1-100, default 50
}
```

**Response** `200 OK`:
```typescript
{
  messages: Message[];
  nextCursor: string | null;    // null = no more pages
}
```

```typescript
interface Message {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  content: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  createdAt: string;
}
```

#### `POST /api/conversations/:id/messages`

Sends a message via HTTP (fallback for when WebSocket is unavailable).

**Request Body:**
```typescript
{
  type: "TEXT" | "IMAGE" | "FILE";
  content?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
}
```

**Response** `201 Created`: The full `Message` object.

**Implementation Note:** The Socket.IO event `message:send` is the primary path for message delivery. This HTTP endpoint exists as:
1. A fallback when WebSocket fails
2. A mechanism for file uploads where multipart is needed

#### `PATCH /api/messages/:id`

Edits a message. Only the sender can edit their own message.

**Request Body:**
```typescript
{
  content: string;    // New content
}
```

**Response** `200 OK`: Updated `Message`.

**Errors:** `403` if not the sender.

#### `DELETE /api/messages/:id`

Deletes a message. Only the sender can delete.

**Response** `204 No Content`.

### 7.7 Upload Endpoint

#### `POST /api/upload`

Uploads a file to ImageKit.

**Request Body:** `multipart/form-data`
```typescript
{
  file: File;    // Image or file to upload
}
```

**Response** `201 Created`:
```typescript
{
  url: string;
  thumbnailUrl: string;     // ImageKit auto-generated thumbnail
  fileName: string;
  fileSize: number;
}
```

### 7.8 Video Call Endpoints

#### `POST /api/calls/rooms`

Creates a Daily.co room for video calling.

**Request Body:**
```typescript
{
  conversationId: string;   // Link the call to a conversation
}
```

**Response** `201 Created`:
```typescript
{
  roomUrl: string;
  roomName: string;
}
```

#### `GET /api/calls/rooms/:name`

Gets the status of a Daily.co room.

**Response** `200 OK`:
```typescript
{
  roomUrl: string;
  roomName: string;
  active: boolean;    // Whether participants are currently in the call
}
```

---

## 8. WebSocket Protocol

### 8.1 Connection

```
Client                              Socket.IO Server
  │                                       │
  │── connect({ auth: { token } }) ──────→│
  │                                       │── verify JWT
  │                                       │── if valid: accept
  │←────────── connected ─────────────────│
  │                                       │
  │── join:conversations ────────────────→│
  │  { conversationIds: string[] }        │── join Socket.IO rooms
```

**Connection Details:**
- Transport: WebSocket (`wss://`) with long-polling fallback
- Auth token sent in `auth.token` during handshake
- Server validates JWT on connection; rejects with `401` if invalid
- After connection, client emits `join:conversations` with all conversation IDs it has access to
- Server verifies membership before joining rooms

### 8.2 Event Catalog

#### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `message:send` | `{ conversationId, type, content?, fileUrl?, thumbnailUrl?, fileName?, fileSize? }` | Send a new message |
| `message:edit` | `{ messageId, content }` | Edit an existing message |
| `message:delete` | `{ messageId }` | Delete a message |
| `conversation:join` | `{ conversationId }` | Join a conversation room |
| `conversation:leave` | `{ conversationId }` | Leave a conversation room |
| `user:typing` | `{ conversationId }` | User started typing |
| `user:stop-typing` | `{ conversationId }` | User stopped typing |
| `call:start` | `{ conversationId, roomUrl }` | Notify room of incoming call |
| `call:end` | `{ conversationId }` | Notify room call ended |

#### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `message:new` | `Message` (full object) | New message broadcast to room |
| `message:updated` | `Message` | Edited message broadcast |
| `message:deleted` | `{ messageId, conversationId }` | Deletion notification |
| `user:typing` | `{ userId, conversationId, displayName }` | Typing indicator |
| `user:stop-typing` | `{ userId, conversationId }` | Stop typing indicator |
| `user:online` | `{ userId, online: boolean }` | Online status change |
| `call:incoming` | `{ conversationId, roomUrl, callerId, callerName }` | Incoming call notification |
| `call:ended` | `{ conversationId }` | Call ended notification |

### 8.3 Message Delivery Flow

```
Sender Client                Socket.IO Server              Recipient Client(s)
     │                             │                             │
     │  message:send               │                             │
     │────────────────────────────→│                             │
     │                             │                             │
     │                             │── 1. Validate payload       │
     │                             │── 2. Verify sender is       │
     │                             │    member of conversation   │
     │                             │── 3. Persist to DB          │
     │                             │── 4. Construct full Message │
     │                             │    object (join sender info)│
     │                             │                             │
     │                             │  message:new                │
     │                             │────────────────────────────→│
     │                             │                             │
     │←──────── ack ───────────────│                             │
     │  { messageId, status: "ok"}│                             │
```

### 8.4 Room Strategy

Each conversation is a Socket.IO room identified by `conversation:<id>`.

```
Socket.IO Server
│
├── Room: conversation:uuid-1
│   ├── user-A (connected socket)
│   ├── user-B (connected socket)
│
├── Room: conversation:uuid-2
│   ├── user-A (connected socket)
│   ├── user-C (connected socket)
│   ├── user-D (connected socket)
```

- Users may have multiple socket connections (multiple tabs) — handled via Socket.IO's built-in `sockets` per-room iteration
- When a user sends a message, `socket.to(room)` emits to everyone **except** the sender
- The sender receives an acknowledgment callback instead of the event

---

## 9. Authentication & Authorization

### 9.1 Authentication Flow

```
┌─────────┐     ┌───────────┐     ┌─────────┐
│ Client  │     │  Next.js  │     │   DB    │
└────┬────┘     └─────┬─────┘     └────┬────┘
     │                │                │
     │  POST /login   │                │
     │  {email,pass}  │                │
     │───────────────→│                │
     │                │  findUser      │
     │                │───────────────→│
     │                │←───────────────│
     │                │                │
     │                │  bcrypt.compare│
     │                │  (password,    │
     │                │   storedHash)  │
     │                │                │
     │                │  sign JWT      │
     │                │  {userId,email}│
     │                │                │
     │←── 200 {user,  │                │
     │    accessToken}│                │
     │                │                │
     │  Store token   │                │
     │  (memory)      │                │
```

### 9.2 Token Validation

**HTTP:** Extracted from `Authorization` header in middleware or route handler.

```typescript
function authenticate(request: NextRequest): AccessTokenPayload {
  const header = request.headers.get("Authorization");
  const token = header?.replace("Bearer ", "");
  if (!token) throw new AuthError("Missing token");
  return verifyAccessToken(token);
}
```

**WebSocket:** Extracted from `auth.token` in handshake data.

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
});
```

### 9.3 Authorization Rules

| Resource | Rule |
|---|---|
| Conversation (view) | User must be a member |
| Conversation (create) | Any authenticated user |
| Conversation (delete) | Any member |
| Message (create) | User must be member of the conversation |
| Message (edit) | Only the sender |
| Message (delete) | Only the sender |

---

## 10. Data Flow Sequences

### 10.1 User Registration

```
Client                     Next.js                        DB
  │                          │                            │
  │ POST /api/auth/register  │                            │
  │ { email, password,       │                            │
  │   displayName }          │                            │
  │─────────────────────────→│                            │
  │                          │ Zod.validate(body)         │
  │                          │── (schema validation)      │
  │                          │                            │
  │                          │ findUserByEmail(email)     │
  │                          │───────────────────────────→│
  │                          │←──────── null ─────────────│
  │                          │                            │
  │                          │ bcrypt.hash(password)      │
  │                          │                            │
  │                          │ createUser({...})          │
  │                          │───────────────────────────→│
  │                          │←──────── User ─────────────│
  │                          │                            │
  │                          │ signAccessToken({userId,   │
  │                          │   email})                  │
  │                          │                            │
  │←── 201 { user,           │                            │
  │    accessToken }         │                            │
```

### 10.2 Sending a Message (Real-Time)

```
Sender Client            Socket.IO Server                 DB          Recipient
     │                        │                          │              │
     │  message:send          │                          │              │
     │  { conversationId,     │                          │              │
     │    type: "TEXT",       │                          │              │
     │    content: "Hello" }  │                          │              │
     │───────────────────────→│                          │              │
     │                        │  Validate payload        │              │
     │                        │  Check room membership   │              │
     │                        │                          │              │
     │                        │  INSERT message          │              │
     │                        │─────────────────────────→│              │
     │                        │←─────── Message ─────────│              │
     │                        │                          │              │
     │                        │  Construct response with │              │
     │                        │  sender info (join User) │              │
     │                        │                          │              │
     │←── ack { status:"ok",  │                          │              │
     │    messageId }         │                          │              │
     │                        │                          │              │
     │                        │  message:new (full obj)  │              │
     │                        │  (to room, except sender)│              │
     │                        │────────────────────────────────────────→│
```

### 10.3 Initiating a Video Call

```
Caller Client           Next.js          Daily.co API        Socket.IO        Recipient
     │                    │                  │                  │                │
     │ POST /api/calls/   │                  │                  │                │
     │ rooms              │                  │                  │                │
     │ { conversationId } │                  │                  │                │
     │───────────────────→│                  │                  │                │
     │                    │ POST /rooms      │                  │                │
     │                    │ (Daily REST API) │                  │                │
     │                    │─────────────────→│                  │                │
     │                    │←── { url, name }─│                  │                │
     │                    │                  │                  │                │
     │← 201 { roomUrl,    │                  │                  │                │
     │   roomName }       │                  │                  │                │
     │                    │                  │                  │                │
     │ call:start         │                  │                  │                │
     │ { conversationId,  │                  │                  │                │
     │   roomUrl }        │                  │                  │                │
     │─────────────────────────────────────────────────────────→│                │
     │                    │                  │                  │                │
     │                    │                  │                  │ call:incoming  │
     │                    │                  │                  │────────────────→│
     │                    │                  │                  │                │
     │ Open Daily prebuilt│                  │                  │  Open Daily    │
     │ UI with roomUrl    │                  │                  │  prebuilt UI   │
     │                    │                  │                  │  with roomUrl  │
```

---

## 11. Frontend Architecture

### 11.1 Page Tree

```
/                           → Redirect to /conversations (if authed) or /login
/login                      → LoginPage (email, password form)
/register                   → RegisterPage (email, password, displayName form)
/conversations              → ConversationListPage (sidebar + empty state)
/conversations/:id          → ConversationPage (sidebar + chat view)
/conversations/:id/call     → CallPage (overlay with Daily.co)
/settings                   → SettingsPage (profile editing)
```

### 11.2 Component Tree

```
<AuthProvider>
  <SocketProvider>
    <Layout>
      ├── <Sidebar>
      │     ├── <SearchBar />
      │     ├── <NewConversationButton />
      │     └── <ConversationList>
      │           └── <ConversationItem /> (×N)
      │                 ├── <Avatar />
      │                 ├── name, last message preview
      │                 └── <UnreadBadge />
      │
      └── <MainContent>
            ├── <EmptyState />     (no conversation selected)
            ├── <ChatView>         (conversation selected)
            │     ├── <ConversationHeader>
            │     ├── <MessageList>
            │     │     └── <MessageBubble /> (×N)
            │     │           ├── sender name, avatar
            │     │           └── content (text / image / file)
            │     ├── <TypingIndicator />
            │     └── <MessageInput>
            │           ├── text input
            │           └── file upload button
            │
            └── <CallInterface>    (in-call overlay)
                  └── Daily.co prebuilt <DailyCall />
    </Layout>
  </SocketProvider>
</AuthProvider>
```

### 11.3 State Management

State is managed via React Context + custom hooks — no external state library for MVP.

| Context | State | Purpose |
|---|---|---|
| `AuthProvider` | `user`, `accessToken`, `isLoading` | Auth state across the app |
| `SocketProvider` | `socket` (SocketIO.Client), `isConnected` | WebSocket connection |

Custom hooks encapsulate data fetching and caching:

| Hook | Data Source | Caching |
|---|---|---|
| `useAuth()` | AuthProvider context | In-memory (token) |
| `useSocket()` | SocketProvider context | Persistent connection |
| `useConversations()` | HTTP GET + Socket.IO events | In-memory array, updated via events |
| `useMessages(conversationId)` | HTTP GET (paginated) + Socket.IO events | In-memory array, appended via events |

---

## 12. Project Structure

```
better-communication/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers, fonts)
│   ├── page.tsx                  # Redirect handler
│   ├── globals.css               # Tailwind CSS imports
│   │
│   ├── login/
│   │   └── page.tsx              # Login page
│   ├── register/
│   │   └── page.tsx              # Register page
│   ├── conversations/
│   │   ├── page.tsx              # Conversation list page
│   │   └── [id]/
│   │       ├── page.tsx          # Chat view page
│   │       └── call/
│   │           └── page.tsx      # Video call page (overlay)
│   ├── settings/
│   │   └── page.tsx              # Settings page
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts # Done
│       │   └── login/route.ts    # Done
│       ├── conversations/
│       │   ├── route.ts          # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts      # GET, DELETE
│       │       └── messages/
│       │           └── route.ts  # GET (paginated), POST
│       ├── messages/
│       │   └── [id]/
│       │       └── route.ts      # PATCH (edit), DELETE
│       ├── upload/
│       │   └── route.ts          # POST (ImageKit)
│       └── calls/
│           └── rooms/
│               ├── route.ts      # POST (create)
│               └── [name]/
│                   └── route.ts  # GET (status)
│
├── server/
│   ├── socket.ts                 # Socket.IO server entry point
│   ├── socket-auth.ts            # JWT verification middleware
│   └── socket-handlers.ts        # Event handler registration
│
├── modules/
│   ├── auth/                     # Done
│   │   ├── schema.ts
│   │   ├── service.ts
│   │   └── repository.ts
│   │
│   ├── conversation/
│   │   ├── schema.ts             # Zod schemas (create conversation, etc.)
│   │   ├── service.ts            # Business logic
│   │   └── repository.ts         # Prisma queries
│   │
│   └── message/
│       ├── schema.ts             # Zod schemas (send message, edit, etc.)
│       ├── service.ts            # Business logic
│       └── repository.ts         # Prisma queries
│
├── lib/
│   ├── env.ts                    # Environment variable access
│   ├── jwt.ts                    # JWT sign/verify
│   ├── password.ts               # bcrypt hash/verify
│   ├── prisma.ts                 # Prisma client singleton
│   ├── api-error.ts              # Standardized error response helper
│   ├── daily.ts                  # Daily.co REST API client
│   └── imagekit.ts               # ImageKit upload client
│
├── components/
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   ├── conversation/
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── NewConversationModal.tsx
│   ├── call/
│   │   ├── CallButton.tsx
│   │   └── CallInterface.tsx
│   └── ui/
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Spinner.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useConversations.ts
│   ├── useMessages.ts
│   └── useTypingIndicator.ts
│
├── providers/
│   ├── AuthProvider.tsx
│   └── SocketProvider.tsx
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── server/
│   └── socket.ts                 # Socket.IO server
│
├── docs/
│   └── plan.md                   # This document
│
├── lib/                          # Shared utilities
├── AGENTS.md                     # AI agent instructions
├── .prettierrc                   # Code style config
└── package.json
```

---

## 13. Implementation Phases

### Phase 1: Authentication Foundation (Complete)

- [x] Register API endpoint
- [x] Login API endpoint
- [x] JWT sign/verify utilities
- [x] Password hashing
- [x] Prisma schema (User model)

**Remaining:**
- [ ] Login page UI
- [ ] Register page UI
- [ ] AuthProvider (React context)
- [ ] useAuth hook
- [ ] Protected route logic (redirect to /login if unauthenticated)
- [ ] Token storage and Authorization header injection

### Phase 2: Conversation Management

**Estimated effort:** 2-3 days

- [ ] Conversation model CRUD (API)
- [ ] Duplicate DIRECT conversation detection
- [ ] Conversation list API (with last message, unread count)
- [ ] Conversation page UI
- [ ] New conversation modal (search users, create 1:1 or group)
- [ ] Conversation sidebar component

### Phase 3: Real-Time Messaging

**Estimated effort:** 3-4 days

- [ ] Socket.IO server setup (separate process)
- [ ] JWT auth on WebSocket handshake
- [ ] Room management (join/leave based on conversation membership)
- [ ] message:send handler (validate, persist, broadcast)
- [ ] message:new broadcast to room
- [ ] HTTP fallback for message sending
- [ ] Message list component with pagination
- [ ] Message input component
- [ ] Optimistic UI updates (show message immediately, reconcile on server ack)

### Phase 4: File Sharing

**Estimated effort:** 1-2 days

- [ ] ImageKit upload API route
- [ ] ImageKit client library
- [ ] File upload UI (drag & drop / picker)
- [ ] Image preview in message bubbles
- [ ] Loading state during upload

### Phase 5: Presence & Typing Indicators

**Estimated effort:** 1 day

- [ ] Online/offline tracking via Socket.IO connection events
- [ ] Typing indicator events (throttled — emit at most once per 3 seconds)
- [ ] Typing indicator UI ("User is typing...")
- [ ] Stop-typing detection (on blur, on submit, after 5s inactivity)

### Phase 6: Video Calling

**Estimated effort:** 2-3 days

- [ ] Daily.co REST API client (create room, get room)
- [ ] Create room API endpoint
- [ ] Call start/end Socket.IO events
- [ ] Incoming call notification UI
- [ ] Daily prebuilt UI integration
- [ ] Call overlay page
- [ ] Handle concurrent calls (only one active call per conversation)

### Phase 7: Edit & Delete Messages

**Estimated effort:** 1 day

- [ ] Edit message API + Socket.IO event
- [ ] Delete message API + Socket.IO event
- [ ] Edit UI (inline edit on click)
- [ ] Delete UI (confirmation, "Message deleted" placeholder)

### Phase 8: Polish & Edge Cases

**Estimated effort:** 2-3 days

- [ ] Loading states (skeleton screens)
- [ ] Empty states (no conversations, no messages)
- [ ] Error states (network failure, reconnection)
- [ ] Socket.IO reconnection with exponential backoff
- [ ] Unread message count updates
- [ ] Scroll-to-bottom on new message
- [ ] Pull-to-load-more pagination

---

## 14. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R1 | JWT secret leaked | Low | Critical | Store in environment variable, rotate immediately if compromised; never commit to version control |
| R2 | Socket.IO server crashes | Low | High | Auto-restart via process manager (PM2 / Docker restart policy); messages also persisted via HTTP fallback |
| R3 | Database connection pool exhaustion | Medium | High | Prisma handles pooling via Neon adapter; monitor connection count; set connection limit in Prisma config |
| R4 | ImageKit API rate limit | Low | Medium | Implement client-side file size limits; queue uploads if needed |
| R5 | Daily.co API outage | Low | Medium | Show "Video call unavailable" gracefully; chat remains functional |
| R6 | WebSocket connection drops (mobile) | High | Low | Socket.IO auto-reconnects with exponential backoff; queued messages resent on reconnect |
| R7 | SQL injection via message content | Low | Critical | Prisma parameterizes all queries; Zod validates input shape; never concatenate user input into SQL |
| R8 | XSS via message content | Medium | High | React escapes HTML by default; sanitize any raw HTML rendering with DOMPurify if needed |

---

## 15. Non-Goals & Future Considerations

### Explicitly Out of Scope (MVP)

| Feature | Rationale | Future Priority |
|---|---|---|
| Push notifications | Requires native app or service worker setup; not essential for web MVP | High |
| End-to-end encryption | Adds significant implementation and key management complexity | Low |
| Message search | Requires full-text search index or Elasticsearch | Medium |
| Read receipts | Per-message read tracking adds DB complexity | Low |
| Rate limiting | Essential for production but not for MVP testing | High |
| CI/CD pipeline | Local development only for MVP | Medium |
| Mobile native apps | PWA is sufficient for MVP | Low |
| Voice calls | Video calls cover the real-time communication need | Low |
| File type restrictions (video, etc.) | Accept all types for MVP; restrict later | Low |
| Admin panel | No administrative features in MVP | Low |
| Multi-device sessions | One session at a time is acceptable for MVP | Medium |

### Technical Debt to Track

- Separate Socket.IO process adds deployment complexity — containerize with Docker for production
- No automated tests currently — add at minimum integration tests for critical paths before production launch
- `ACCESS_TOKEN_SECRET` is "apple" in `.env` — **must** be changed to a strong random value before any public deployment
- The Prisma global cache fix (`if (!isProd)`) needs verification with actual hot-reload testing

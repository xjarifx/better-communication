# Better-Communication — Developer Guide

Build the platform phase-by-phase. Each phase tells you what to do, what files to create, and what pitfalls to avoid — the actual code lives in the files you write.

---

## Architecture at a Glance

```
Browser ──HTTP──► Next.js App Router (API routes)
Browser ──WS────► Custom WebSocket server (bound to same port)
Browser ──direct► ImageKit.io (media uploads, bypass server)
Next.js ──Prisma──► PostgreSQL
Next.js ──REST──► Daily.co API (group call rooms)
```

---

## PHASE 0: Prerequisites

- Node.js >= 20, PostgreSQL running, npm installed
- Run `npm install`, then add `ws` and `@types/ws` (not yet in package.json)
- Configure `.env` with: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `IMAGEKIT_*`, `DAILY_API_KEY`
- Verify with `npm run build && npm run lint` before proceeding

---

## PHASE 1: Database Layer

**Goal:** Prisma schema + migration + client singleton.

**Files to create:**
- `prisma/schema.prisma` — Models: `User`, `Conversation`, `ConversationMember`, `Message`, `RefreshToken`. Enums: `ConversationType` (DIRECT/GROUP), `MessageType` (TEXT/IMAGE/VIDEO/FILE)
- `lib/prisma.ts` — Prisma client singleton (standard globalThis pattern to avoid hot-reload leaks)

**Pitfalls:**
- The `@@index([conversationId, createdAt(sort: Desc)])` on `Message` is **critical** — without it, cursor pagination will be slow on large datasets
- Use `@db.Uuid` for all ID fields (enables native PostgreSQL UUID columns)
- `RefreshToken.tokenHash` must be `@unique` — the replay detection flow relies on this

**Verify:** `npm run prisma:studio` — confirm all 5 tables exist and are empty.

---

## PHASE 2: Authentication Engine

**Goal:** Register, login, logout, and refresh-token rotation with replay attack detection.

**Files to create:**
- `lib/jwt.ts` — `signAccessToken`, `verifyAccessToken`, `hashPassword`/`verifyPassword`, `signRefreshToken`, `hashToken`, `REFRESH_COOKIE_OPTIONS`
- `lib/auth.ts` — `getAuthUser(req)` helper for route handlers (extracts Bearer token, calls `verifyAccessToken`)
- `app/api/auth/register/route.ts` — Validates unique email, hashes password with scrypt, creates user + refresh token row, sets httpOnly cookie
- `app/api/auth/login/route.ts` — Validates credentials, issues tokens, sets cookie
- `app/api/auth/refresh/route.ts` — Single-use rotation: delete old hash, create new. **If hash not found (replay)**, delete ALL refresh tokens for that user, clear cookie, return 403
- `app/api/auth/logout/route.ts` — Delete matching refresh token row, clear cookie

**Pitfalls:**
- Use `crypto.scryptSync` + `timingSafeEqual` for password hashing (Node.js built-in, no `bcrypt` dependency needed)
- Refresh tokens are stored as SHA-256 hashes — never store the raw token
- Cookie `path: '/api/auth'` restricts auto-send to auth endpoints only, reducing CSRF surface
- `expiresAt` on refresh tokens must be checked server-side (not just cookie `maxAge`)
- The replay detection branch (hash not found) must NOT reveal whether the token was invalid or just expired — always return 403

**Verify:** `curl -X POST /api/auth/register` → 201 + `accessToken` in body + `refreshToken` cookie. `curl -X POST /api/auth/refresh` with cookie → new tokens. Reuse the old refresh token → 403 + all sessions revoked.

---

## PHASE 3: API Auth Guard (Next.js 16 Proxy)

**Goal:** Protect all `/api/*` routes except public auth endpoints.

**File to create:**
- `proxy.ts` at **project root** (sibling to `app/`, not inside it)

**Key points:**
- In Next.js 16, `middleware.ts` is deprecated — use `proxy.ts` with a named `proxy` export
- The file goes at root level (same directory as `package.json`)
- Export a `config` object with `matcher: '/api/:path*'` to scope it
- Skip validation for `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- Use `verifyAccessToken` from `lib/jwt.ts` on the `Authorization: Bearer <token>` header
- Return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })` on failure

**Pitfalls:**
- The proxy runs before every matched request — keep it lightweight (no DB calls, no heavy crypto)
- Don't import Prisma or other heavy modules here
- `NextResponse.next()` passes through; any returned `NextResponse` short-circuits

**Verify:** `curl /api/conversations` without `Authorization` header → 401. With valid token → 200.

---

## PHASE 4: REST API Layer

**Goal:** Full CRUD for conversations and messages.

**Files to create:**
- `app/api/conversations/route.ts`
  - `GET` — List user's conversations with last message preview, member info, unread counts
  - `POST` — Create conversation (DIRECT or GROUP); DIRECT must deduplicate existing 1:1 channels
- `app/api/conversations/[id]/messages/route.ts`
  - `GET` — Cursor-based pagination (`?before=<uuid>&limit=50`). Query `createdAt < cursor.createdAt`, sort desc, take `limit + 1` to detect `hasMore`, reverse for chronological order
  - `POST` — Send text message; save to DB; broadcast via WebSocket (see Phase 5)
- `app/api/conversations/[id]/messages/media/route.ts` — `POST` to record uploaded file metadata; broadcast via WS
- `app/api/conversations/[id]/read/route.ts` — `POST` to update `lastReadAt` on the user's membership record
- `app/api/auth/imagekit/route.ts` — `GET` to return `{ signature, token, expire }` (HMAC-SHA1 signed with `IMAGEKIT_PRIVATE_KEY`)
- `app/api/conversations/[id]/call/route.ts` — `POST` to create a Daily.co room, return `roomUrl`, broadcast `group_call_incoming` via WS

**Pitfalls:**
- Always `await params` in route handlers — Next.js 16 made params `Promise<>` (since v15)
- Cursor pagination: fetch `limit + 1` rows; if you get `limit + 1`, you know there are more. Pop the extra row. Return `nextCursor` as the oldest message's ID
- Broadcast functions from `server.mjs` are not importable from route handlers. Instead, create `lib/ws-server.ts` that reads `globalThis.__wss` (set by `server.mjs`)
- The DIRECT conversation dedup: sort both user IDs, then find a conversation where all user IDs match as members
- File size/type validation should happen **client-side** before the upload starts

**Verify:** Create conversation → 201. Send message → 201 + receive via WS (next phase). Get messages with cursor → paginated results.

---

## PHASE 5: WebSocket Server (Custom)

**Goal:** Real-time messaging, typing indicators, presence tracking, and WebRTC signaling.

**Files to create:**
- `server.mjs` at **project root** — Custom Next.js server binding WS to the same HTTP server
- `lib/ws-server.ts` — Shared module for WS state (rooms, user connections, broadcast helpers)

**Architecture:**
- Create a single `http.createServer`, pass all requests to Next.js's `getRequestHandler()`
- Attach a `WebSocketServer` with `noServer: true`
- On `upgrade`, parse `?token=<jwt>` from URL, verify JWT. Reject (status 401, close code 4001) on failure
- Store the WSS instance and room/connection maps on `globalThis` so `lib/ws-server.ts` can read them
- Route handlers import `broadcastToRoom` from `lib/ws-server.ts` to push live updates

**Events to handle:**
| Event | Direction | Action |
|-------|-----------|--------|
| `ping` | Client→Server | Echo `pong` |
| `subscribe` | Client→Server | Add WS to room's Set |
| `message` | Client→Server | Save to DB, broadcast to room |
| `typing` | Client→Server | Broadcast to room (exclude sender) |
| `call_offer`, `call_answer`, `ice_candidate` | Client→Server | Relay to target user's connections |

**Presence tracking:**
- Map `userId → Set<WebSocket>` for multi-tab support
- On connect, if set went from 0→1, broadcast `presence: online`
- On disconnect, remove from set; if 0, wait 2-second grace period before broadcasting `presence: offline`

**Pitfalls:**
- `server.mjs` is **not bundled** by Next.js — use plain ES module syntax, avoid TypeScript imports
- The `upgrade` handler must verify the JWT **synchronously** before `handleUpgrade` — the standard ws pattern is: try `jwt.verify`, catch → reject
- Don't forget `serverExternalPackages: ["ws"]` in `next.config.ts` (tells Next.js not to bundle `ws` into the client)
- Update `package.json` scripts: `"dev": "node server.mjs"`, `"start": "NODE_ENV=production node server.mjs"`
- Client sends `ping` every 25s; if no `pong` for 50s, treat as disconnected and reconnect

**Verify:** Connect with valid JWT token → receive `{"type":"pong"}`. Connect with bad token → close with code 4001.

---

## PHASE 6: Client UI

**Goal:** Auth pages, dashboard layout, and core chat components.

**Files to create:**
- `app/globals.css` — Tailwind v4 imports + HSL theme token variables (`--color-surface`, `--color-accent`, etc.)
- `app/layout.tsx` — Root layout with Geist fonts, HTML classes
- `app/(auth)/login/page.tsx` — Email/password form, `POST /api/auth/login`, store token in localStorage, redirect
- `app/(auth)/register/page.tsx` — Same pattern, `POST /api/auth/register`
- `app/(dashboard)/layout.tsx` — Wraps `AuthProvider` + `Sidebar` + main content area
- `app/components/Sidebar.tsx` — User avatar, conversation list, logout
- `app/components/ConversationList.tsx` — Fetches conversations, shows last message + unread badge, active state
- `app/components/ChatWindow.tsx` — Hosts `MessageList` + `ChatInput`, reads `conversationId` from URL
- `app/components/MessageList.tsx` — Infinite scroll, cursor-based pagination, renders `MessageBubble` list
- `app/components/MessageBubble.tsx` — Message content, timestamp, sender, status (sending/sent/failed)
- `app/components/ChatInput.tsx` — Text input, send button, file upload trigger, throttled `typing` emission
- `app/components/TypingIndicator.tsx` — Animated dots when others type
- `app/components/Avatar.tsx` — Circle with user initials, online dot
- `app/components/FileUploadButton.tsx` — File picker → validate → call `uploadFile()` → POST media endpoint
- `app/components/CallButton.tsx` / `app/components/CallOverlay.tsx` — Call controls

**Pitfalls:**
- `params` in page components are `Promise<>` — use `use()` in client components or `await` in server components
- Sidebar layout: desktop = fixed 350px sidebar + flexible main; mobile = slide-over drawer
- Store `accessToken` in `localStorage`, not in-memory only (survives refresh). The Proxy checks it via `Authorization` header
- Only render the WebSocket-dependent UI when the connection is established

---

## PHASE 7: WebSocket Client

**Goal:** Persistent WS connection with heartbeat, auto-reconnect, and event subscriptions.

**File to create:**
- `lib/ws-client.ts` — Singleton `WebSocketClient` class

**Requirements:**
- Connect: `ws[s]://host/ws?token=<accessToken>`
- Heartbeat: `ping` every 25s, expect `pong`
- Auto-reconnect: exponential backoff (1s, 2s, 4s, 8s... up to 30s), max 10 attempts
- `subscribe(conversationId)` — sends `{ type: "subscribe", conversationId }`
- `send(data)` — JSON-serialize and send
- `on(type, handler)` — register handler for server events; returns unsubscribe function
- `disconnect()` — clean up

**Pitfalls:**
- Reconnect must not stack — clear the previous reconnect timer on successful connection
- On reconnect, resubscribe to all active rooms the user was in
- The `on` method should return an unsubscribe function for clean useEffect cleanup
- Don't reconnect on intentional `disconnect()` (logout)

---

## PHASE 8: State Management

**Goal:** React contexts for auth, chat (with optimistic updates), and presence.

**Files to create:**
- `app/context/AuthContext.tsx`
- `app/context/ChatContext.tsx`
- `app/context/PresenceContext.tsx`

**AuthContext:**
- Stores `user`, `accessToken`
- Calls `wsClient.connect(token)` on login
- `logout()` calls `POST /api/auth/logout`, clears localStorage, disconnects WS

**ChatContext:**
- Maintains `messages: Record<conversationId, Message[]>` state
- `sendMessage(conversationId, content)`:
  1. Generate `temp-${uuid()}` ID
  2. Push optimistic message with `status: "sending"` immediately
  3. Send via WS
  4. Set 5-second timeout → if no confirmation, mark `status: "failed"`
- WS `message` handler: find message by `tempId` in state, replace with server record (mark `status: null`)
- `retryMessage(conversationId, tempId)` — resend, reset timeout

**PresenceContext:**
- Listens for `presence` WS events
- Maintains `Record<userId, "online" | "offline">`

**Pitfalls:**
- The optimistic message map uses `tempId` as the key — the server echoes it back so the client can reconcile
- Clear the 5-second timer when confirmation arrives (prevent "failed" after "sent")
- `PresenceContext` updates should not cause re-renders of the entire message list — keep contexts separate
- On conversation switch, preserve loaded messages in state so back-navigation is instant

---

## PHASE 9: Media Upload

**Goal:** Direct browser-to-ImageKit upload for images, videos, and files.

**File to create:**
- `lib/upload.ts` — `uploadFile(file)` function

**Flow:**
1. Client calls `GET /api/auth/imagekit` to get `{ signature, token, expire }`
2. Build `FormData` with: file, `publicKey`, `signature`, `token`, `expire`, `fileName`, `folder`
3. POST directly to `https://upload.imagekit.io/api/v1/files/upload`
4. On success, `POST /api/conversations/:id/messages/media` with fileUrl, thumbnailUrl, etc.

**Client-side validation (before upload):**

| Type | Max Size | Allowed Formats |
|------|----------|-----------------|
| IMAGE | 10 MB | jpeg, png, webp, gif |
| VIDEO | 50 MB | mp4, webm |
| FILE | 100 MB | pdf, zip, docx |

**Pitfalls:**
- Always validate file size and type on the client — don't waste an upload round-trip on invalid files
- Generate `fileName` as `${uuid}-${originalName}` to prevent collisions
- `thumbnailUrl` for images: append `?tr=w-200,h-200,fo-auto`. For videos: `?tr=so-1` (frame at 1s)
- Show an optimistic placeholder (local blob URL) while uploading, replace with server URL on completion

---

## PHASE 10: WebRTC & Video Calls

**Goal:** 1:1 peer-to-peer calls via WebRTC + group calls via Daily.co.

**File to create:**
- `app/context/CallContext.tsx`

**1:1 call flow:**
1. Caller requests `getUserMedia({ video, audio })`
2. Creates `RTCPeerConnection` with Google's public STUN server
3. Adds local tracks, creates SDP offer → sends `call_offer` via WS
4. Callee receives `call_offer`, prompts user. On accept: `getUserMedia`, create `RTCPeerConnection`, `setRemoteDescription(offer)`, create answer → sends `call_answer`
5. Both sides exchange `ice_candidate` events via WS
6. `ontrack` on both sides → render remote stream in `<video>`

**Group call flow:**
1. Client `POST /api/conversations/:id/call`
2. Server creates Daily.co room (1-hour expiry), returns `roomUrl`, broadcasts `group_call_incoming` via WS
3. All members open the Daily.co prebuilt meeting UI

**Pitfalls:**
- Add `stun:stun.l.google.com:19302` as an ICE server — without it, calls won't work on most networks
- Clean up `RTCPeerConnection` and media tracks on hangup (`tracks.forEach(t => t.stop())`)
- 1:1 calls use **direct P2P** (no media server cost); group calls use **Daily.co** (SFU-based, scales better)
- The `call_offer`/`call_answer`/`ice_candidate` WS messages should be relayed only to the target user, not broadcast to the room
- Show a ringing overlay on incoming call with accept/decline buttons

---

## PHASE 11: Testing

**Goal:** Database integrity, E2E real-time delivery, manual QA.

**Install:** `vitest`, `@playwright/test`, `npx playwright install`

**Database tests (`vitest`):**
- Seed a user + conversation + message, delete conversation, verify messages cascade-deleted
- Populate 50,000 messages, query with cursor pagination, expect <20ms response

**E2E tests (`playwright`):**
- Two browser contexts, user A sends message → user B receives it under 150ms
- Request protected route without token → 401
- Reuse expired refresh token → 403 + all sessions revoked

**Manual QA:**

| Test | Procedure | Expected |
|------|-----------|----------|
| Offline resilience | DevTools → Network → Offline, send message | Optimistic bubble, fails after 5s, Retry button visible |
| Retry | Reconnect, click Retry | Message sends, confirmation replaces optimistic state |
| Multi-tab presence | 3 tabs same user, observe from second user | Shows online; stays online after closing 2 tabs; 2s grace then offline |
| File validation | Upload 120MB file | Client rejects, never hits network |
| Token replay | Call `/api/auth/refresh` with used refresh token | 403, all sessions revoked |

---

## PHASE 12: Build & Deploy

**Commands:**
```bash
npm run build
NODE_ENV=production node server.mjs
```

**Pre-flight checklist:**
- Production `DATABASE_URL` with SSL
- Strong `JWT_SECRET` / `JWT_REFRESH_SECRET`
- Production ImageKit + Daily.co keys
- `serverExternalPackages: ["ws"]` in `next.config.ts`
- Nginx/apache passes `Upgrade` / `Connection` headers for WS

**Nginx (WS support):**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

---

## Spec Quick-Reference

| Phase | Topic | Read This First |
|-------|-------|-----------------|
| 0–1 | System architecture | `spec_01_architecture.md` |
| 1 | Database schema | `spec_02_database.md` |
| 2–3 | Auth & security | `spec_03_auth_security.md` |
| 4 | REST API contracts | `spec_04_api_rest.md` |
| 5, 7 | WebSocket protocol | `spec_05_websocket.md` |
| 6, 9 | Media pipeline | `spec_06_media_pipeline.md` |
| 10 | WebRTC & calls | `spec_07_telephony_calls.md` |
| 8 | State management | `spec_08_state_sync.md` |
| 11 | Verification matrix | `spec_09_verification.md` |

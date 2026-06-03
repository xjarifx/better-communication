# Better Communication

A full-stack real-time messaging and P2P video calling application with group chats, file sharing, and typing indicators. Built with Next.js 16, Socket.IO, WebRTC, and PostgreSQL.

## Features

- **Real-Time Messaging** — Text, image, video, and file sharing with instant delivery via WebSocket. Optimistic UI updates with offline message queue and HTTP fallback.
- **P2P Video Calls** — Peer-to-peer WebRTC video calling with STUN-based NAT traversal. Signaling relayed over Socket.IO for seamless integration.
- **Group & Direct Conversations** — Create 1:1 or group conversations. Add/remove members in groups. Duplicate detection prevents duplicate direct chats.
- **Typing Indicators & Online Presence** — Real-time typing status and online/offline indicators broadcast over Socket.IO.
- **Message Management** — Edit and delete your own messages. Cursor-based pagination for efficient message history loading.
- **Authentication** — JWT-based auth with access tokens, HTTP-only cookie-based refresh, and route protection middleware.

## Demo

> Use one-click demo login on the sign-in page to test instantly.

| Account | Email | Password |
|---|---|---|
| Demo 1 | `jarif@gmail.com` | `jarif@gmail.com` |
| Demo 2 | `jarif2@gmail.com` | `jarif2@gmail.com` |

Create a conversation between the two accounts or send yourself messages to explore all features.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Real-Time | Socket.IO (standalone server on port 3001) |
| Video Calls | WebRTC (P2P with STUN) |
| Database | PostgreSQL (Neon Serverless), Prisma ORM |
| Auth | JWT (jsonwebtoken), bcrypt |
| Styling | Tailwind CSS v4, Radix UI primitives, Lucide icons |
| State | TanStack Query v5 (server state), Zustand v5 (client state) |
| Forms | React Hook Form, Zod validation |
| File Upload | ImageKit |
| Monitoring | Sentry |

## Architecture

```
Browser
  ├── Next.js App (SSR + CSR) — pages, API routes, auth
  └── Socket.IO Client — real-time events, WebRTC signaling
        │
        ▼
Socket.IO Server (Port 3001) — persistent connections, room management
        │
        ▼
PostgreSQL (Neon) — users, conversations, messages
```

Key design decisions:
- **Socket.IO runs standalone** (not embedded in Next.js) because Next.js API routes are serverless and cannot hold persistent TCP connections.
- **JWT-only auth** with short-lived tokens (15 min) to eliminate refresh token storage complexity for MVP scope.
- **P2P WebRTC** (not Jitsi) to remove third-party dependency for video calls.
- **Cursor-based pagination** for messages — stable under concurrent inserts and efficient with indexed queries.

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd better-communication
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL (Neon/PostgreSQL) and ImageKit credentials

# Run database migrations
npm run prisma:migrate

# Start development (Next.js + Socket.IO concurrently)
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
│   ├── (app)/              # Authenticated app layout
│   ├── (auth)/             # Login & register pages
│   └── api/                # REST API route handlers
├── components/             # React components
│   ├── auth/               # Login/register forms
│   ├── call/               # WebRTC video call UI
│   ├── messages/           # Chat UI, message list, input
│   └── ui/                 # Radix-based shadcn-style primitives
├── server/                 # Standalone Socket.IO server
│   ├── socket.ts           # Server entry point
│   ├── socket-auth.ts      # JWT verification middleware
│   └── socket-handlers.ts  # All event handlers
├── modules/                # Service layer (business logic + repositories)
│   ├── auth/               # Auth service & repository
│   ├── conversation/       # Conversation service & repository
│   └── message/            # Message service & repository
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
├── lib/                    # Shared utilities (prisma, jwt, api-client, etc.)
├── prisma/                 # Database schema & migrations
├── types/                  # TypeScript type definitions
└── docs/                   # Technical documentation
```

## What I Learned

- Designing a real-time event system with Socket.IO rooms for multi-user chat scenarios
- Implementing WebRTC peer-to-peer connections with STUN and signaling relay
- Balancing optimistic UI updates with server-side truth for message delivery
- Architecting a fallback chain (WebSocket → REST → offline queue) for resilient messaging
- Structuring a Next.js app with both server-rendered pages and a standalone WebSocket server

## Documentation

- [Technical Specification & Plan](docs/plan.md) — architecture, data model, ADRs, implementation phases
- [API Contract](docs/api-contract.md) — REST endpoint request/response shapes

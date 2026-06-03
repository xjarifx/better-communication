# Architecture

## Overview

The app runs two servers: a **Next.js server** (port 3000) handling SSR and REST API routes, and a **standalone Socket.IO server** (port 3001) for persistent real-time connections.

## Diagram

```
Browser
  ├── Next.js App  ──HTTPS──>  Next.js Server (3000)  ──> PostgreSQL (Neon)
  └── Socket.IO Client ──WSS──> Socket.IO Server (3001) ──> PostgreSQL
```

## Key Decisions

- **Socket.IO is standalone**, not embedded in Next.js, because Next.js API routes are serverless and can't hold persistent TCP connections.
- **JWT-only auth** with 15-minute access tokens + HTTP-only cookie refresh tokens. No server-side session storage.
- **P2P WebRTC** with STUN for video calls. Signaling relayed over existing Socket.IO rooms — no third-party video service.
- **Cursor-based pagination** for messages — stable under concurrent inserts and efficient with indexed queries.

## Project Layout

```
app/             Next.js App Router pages & API routes
server/          Standalone Socket.IO server
modules/         Domain logic (auth, conversation, message)
  ├── schema.ts      Zod validation
  ├── repository.ts  Prisma queries
  └── service.ts     Business logic
components/      React components by feature
hooks/           Custom React hooks
stores/          Zustand state stores
lib/             Shared utilities (prisma, jwt, api-client, etc.)
prisma/          Database schema & migrations
types/           TypeScript type definitions
```

## Request Lifecycle

**REST:** Route handler → module service → module repository → Prisma → PostgreSQL → response.

**WebSocket:** Socket.IO event → authenticate JWT → validate payload → persist to DB → broadcast to room → ack to sender.

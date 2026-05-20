# Specification 01: System Architecture & Tech Stack

This document specifies the high-level infrastructure, technology recommendations, component interfaces, and environment configurations of the Better-Communication system.

---

## 1. System Architecture Diagram

```
                  ┌──────────────────────────────────────────────┐
                  │              Browser (Client SPA)            │
                  │  (React 19 / Next.js / Tailwind v4 / HSL)     │
                  └──────────────┬───────────────▲───────────┬───┘
                                 │               │           │
                            HTTP │ (REST)        │ WebSockets│ Uploads (Direct)
                                 ▼               ▼           ▼
                  ┌──────────────────────────────┴───────────┐ ┌───────────────┐
                  │         Next.js App Router Monolith      │ │ ImageKit.io   │
                  │  (REST API Routes + Custom ws-server)    │ │ (Cloud Media  │
                  └──────────────┬───────────────────────────┘ │ Optimizations)│
                                 │                             └───────┬───────┘
                        Prisma   │                                     │
                        ORM      ▼                                     │ URLs
                  ┌──────────────┴───┐                                 │
                  │ PostgreSQL DB    │◄────────────────────────────────┘
                  │ (User/Chat Data) │
                  └──────────────────┘
                           │
                           │ REST
                           ▼
                  ┌──────────────────┐
                  │ Daily.co API     │
                  │ (Group Calls Room)│
                  └──────────────────┘
```

---

## 2. Infrastructure Flow & Topology

1. **Client SPA (React 19 / Next.js)**: A dark-mode first single-page application built on Next.js App Router. It is responsive, highly interactive, and maintains live TCP connection sockets with the messaging backend.
2. **Next.js Fullstack Server**: Operates as a unified runtime hosting:
   - **REST APIs (`/api/*`)**: Stateless HTTP endpoints governing authentication, membership management, messaging history, and video conference token requests.
   - **WebSocket Thread**: A custom WebSocket server (`ws` library) bound to the server's Node.js instance for real-time bi-directional messaging, signaling, and presence synchronization.
3. **Database Layer (PostgreSQL)**: Serves as the durable system of record, storing schemas for users, direct and group conversations, user channel memberships, historical message feeds, and secure token hashes. Managed via **Prisma ORM**.
4. **Cloud Media Services (ImageKit.io)**: A decoupled media library that optimizes user-submitted files. It acts as an edge CDN, serving compressed images and processing thumbnails on-the-fly. Files bypass the Next.js process entirely, uploading directly from the browser using secure frontend tokens.
5. **Video Telephony Infrastructure (WebRTC & Daily.co)**:
   - **1:1 Audio/Video Calls**: Leverages the browser's native WebRTC engines, utilizing our custom WebSocket channel as a peer exchange/signaling mediator.
   - **Multi-user Group Calls (3+)**: Offloads encoding, decoding, and multiplexing onto Daily.co's infrastructure via live REST API rooms.

---

## 3. Technology Matrix

| Concern | Recommended Technology | Technical Rationale |
| :--- | :--- | :--- |
| **Monolith Framework** | Next.js (App Router) | Integrated full-stack execution context, unified routing, high-performance static rendering capability, and single-port deployment. |
| **Real-Time Transport** | Native `ws` Library | Minimalist, zero-overhead WebSockets. High raw performance, low latency, and zero abstraction layers. |
| **Database** | PostgreSQL | Robust transactional guarantees (ACID), excellent JSON indexing capabilities, rich index support, and horizontal scaling potential. |
| **ORM** | Prisma | Strict schema definitions, full auto-complete TypeScript typing, automated migrations, and optimized SQL join patterns. |
| **Cloud Storage & CDN** | ImageKit.io | Complete media solution. Native support for direct uploads, on-the-fly resizing, smart formatting (AVIF/WebP), and automatic video frame poster extraction. |
| **Video Platform** | Daily.co | Free-tier scalability, dead-simple REST room configuration, and reliable multi-platform React SDK wrappers. |
| **Styling & UI** | Vanilla CSS + Tailwind v4 | Dynamic utility tokens, HSL system matching, custom glassmorphism components, and performant hardware-accelerated animations. |

---

## 4. Environment Blueprint (`.env.template`)

Copy this environment blueprint into your root `.env` configuration file:

```bash
# ==============================================================================
# 1. DATABASE CONFIGURATION (POSTGRESQL)
# ==============================================================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_comm?schema=public"

# ==============================================================================
# 2. CRYPTOGRAPHIC SECURING KEYS (JWT SIGNATURES)
# ==============================================================================
# Set a high-entropy cryptographically secure string (e.g., openssl rand -base64 32)
JWT_SECRET="super-secret-high-entropy-signature-key-256-bit"
JWT_REFRESH_SECRET="secondary-high-entropy-rotator-signature-key-512-bit"

# ==============================================================================
# 3. CLOUD STORAGE CREDENTIALS (IMAGEKIT.IO)
# ==============================================================================
IMAGEKIT_PUBLIC_KEY="public_your_imagekit_public_key..."
IMAGEKIT_PRIVATE_KEY="private_your_imagekit_private_key..."
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id/"

# ==============================================================================
# 4. TELEPHONY CALLING CREDENTIALS (DAILY.CO)
# ==============================================================================
DAILY_API_KEY="api_key_obtained_from_daily_dashboard"
```

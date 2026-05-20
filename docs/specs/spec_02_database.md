# Specification 02: Database Model & Prisma Schema

This specification details the structural design of the PostgreSQL schema, indexes, key relations, and contains the complete, production-grade Prisma schema.

---

## 1. Relational Schema Architecture

The database model is composed of five core tables, optimized for fast relational joins, secure token tracking, and highly efficient cursor pagination.

```
       ┌──────────────────┐               ┌─────────────────────────┐
       │      users       │               │  conversation_members   │
       ├──────────────────┤               ├─────────────────────────┤
       │ PK id (UUID)     │◄─── 1:N ─────►│ PK/FK conversation_id   │
       │    email         │               │ PK/FK user_id           │
       │    passwordHash  │               │       joinedAt          │
       │    displayName   │               │       lastReadAt        │
       │    avatarUrl     │               └────────────▲────────────┘
       └────────▲─────────┘                            │
                │                                      │
                ├─────── 1:N ────────┐                 │ N:1
                │                    │                 │
       ┌────────▼─────────┐ ┌────────▼─────────┐ ┌─────┴────────────┐
       │  refresh_tokens  │ │     messages     │ │  conversations   │
       ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
       │ PK id (UUID)     │ │ PK id (UUID)     │ │ PK id (UUID)     │
       │ FK userId        │ │ FK conversationId│ │    type (ENUM)   │
       │    tokenHash     │ │ FK senderId      │ │    name          │
       │    expiresAt     │ │    type (ENUM)   │ │    createdAt     │
       └──────────────────┘ │    content       │ └──────────────────┘
                            │    fileUrl       │
                            │    thumbnailUrl  │
                            │    fileName      │
                            │    fileSize      │
                            └──────────────────┘
```

---

## 2. Model Properties & Design Decisions

### 1. `users` Table
- **UUID Primary Key**: Enforces global uniqueness and eliminates sequence predictability, preventing enumeration attacks.
- **Email Index**: Marked `@unique` to ensure singular user profiles. Generates a database B-tree index automatically.

### 2. `conversations` Table
- **Conversations**: Governs communication channels.
- **Type Enum**: `DIRECT` (one-to-one) or `GROUP` (multi-user).
- **Name Field**: Optional TEXT parameter, only mandatory when `type` is set to `GROUP`.

### 3. `conversation_members` Table
- **Compound Primary Key**: Combined key structure `@@id([conversationId, userId])` prevents duplicate memberships.
- **`lastReadAt` (TIMESTAMP)**: Stores the exact timestamp when a member last loaded a channel's interface. Essential for unread counts and read receipts.
- **Cascading Deletions**: If a user account or conversation is deleted, the membership record automatically cascades and drops to prevent orphan states.

### 4. `messages` Table
- **Multi-Format Type Enum**: Restricts content formats: `TEXT`, `IMAGE`, `VIDEO`, `FILE`.
- **ImageKit-Optimized Media Columns**: Optional columns `fileUrl`, `thumbnailUrl`, `fileName`, and `fileSize` capture file uploads directly from ImageKit.
- **High-Performance Pagination Index**:
  `@@index([conversationId, createdAt(sort: Desc)])`
  This composite index is **critical**. It enables fast, indexed cursor-pagination by first filtering on `conversationId` and then performing a reverse chronological scan on `createdAt`.

### 5. `refresh_tokens` Table
- **`tokenHash` (SHA-256)**: Cryptographically masks rotation tokens. Even with full database access, attackers cannot hijack sessions since raw rotation keys are never stored.

---

## 3. Production Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum ConversationType {
  DIRECT
  GROUP
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  FILE
}

model User {
  id                  String               @id @default(uuid()) @db.Uuid
  email               String               @unique
  passwordHash        String
  displayName         String
  avatarUrl           String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  // Relations
  memberships         ConversationMember[]
  sentMessages        Message[]
  refreshTokens       RefreshToken[]

  @@map("users")
}

model Conversation {
  id          String               @id @default(uuid()) @db.Uuid
  type        ConversationType     @default(DIRECT)
  name        String?              // Required only for groups
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  // Relations
  members     ConversationMember[]
  messages    Message[]

  @@map("conversations")
}

model ConversationMember {
  conversationId String       @db.Uuid
  userId         String       @db.Uuid
  joinedAt       DateTime     @default(now())
  lastReadAt     DateTime     @default(now())

  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([conversationId, userId])
  @@map("conversation_members")
}

model Message {
  id             String       @id @default(uuid()) @db.Uuid
  conversationId String       @db.Uuid
  senderId       String       @db.Uuid
  type           MessageType  @default(TEXT)
  content        String?      // Message text or caption for media files
  
  // Media fields (Populated via ImageKit Upload Response)
  fileUrl        String?
  thumbnailUrl   String?
  fileName       String?
  fileSize       Int?
  
  createdAt      DateTime     @default(now())

  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt(sort: Desc)])
  @@map("messages")
}

model RefreshToken {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  tokenHash String   @unique // SHA-256 hash of the generated secure token
  expiresAt DateTime
  createdAt DateTime @default(now())

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

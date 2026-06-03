# Database

## Stack

PostgreSQL via Prisma ORM (Neon serverless provider).

## Schema

### User

| Column       | Type     | Notes                |
| ------------ | -------- | -------------------- |
| id           | UUID     | PK                   |
| email        | String   | Unique               |
| passwordHash | String   | bcrypt hashed        |
| displayName  | String   |                      |
| avatarUrl    | String?  | ImageKit URL         |
| createdAt    | DateTime |                      |
| updatedAt    | DateTime |                      |

### Conversation

| Column    | Type           | Notes                          |
| --------- | -------------- | ------------------------------ |
| id        | UUID           | PK                             |
| type      | DIRECT / GROUP | Enum                           |
| name      | String?        | Required for GROUP             |
| createdAt | DateTime       |                                |
| updatedAt | DateTime       |                                |

### ConversationMember

Composite PK of `(conversationId, userId)`. Joins users to conversations.

| Column         | Type     | Notes                     |
| -------------- | -------- | ------------------------- |
| conversationId | UUID     | FK → Conversation (cascade) |
| userId         | UUID     | FK → User (cascade)         |
| joinedAt       | DateTime |                           |

### Message

| Column         | Type              | Notes                              |
| -------------- | ----------------- | ---------------------------------- |
| id             | UUID              | PK                                 |
| conversationId | UUID              | FK → Conversation (cascade)        |
| senderId       | UUID              | FK → User (cascade)                |
| type           | TEXT / IMAGE / VIDEO / FILE | Enum                  |
| content        | String?           | Text body or caption               |
| fileUrl        | String?           | ImageKit URL                       |
| thumbnailUrl   | String?           | ImageKit thumbnail                  |
| fileName       | String?           |                                    |
| fileSize       | Int?              |                                    |
| createdAt      | DateTime          | Indexed (desc) with conversationId |

## Indexes

- `messages(conversationId, createdAt DESC)` — cursor-based pagination queries.

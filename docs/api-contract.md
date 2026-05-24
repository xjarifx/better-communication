# Better Communication — API Contract

**Base URL:** `http://localhost:3000`  
**Auth:** `Authorization: Bearer <access_token>` (required on all except `/api/auth/*`)

---

## Common Error Shape

```typescript
{
  error: string;        // Machine-readable error key
  details?: unknown[];  // Validation issues (only on 400)
}
```

---

## Auth Endpoints

### `POST /api/auth/register` — Create account

**Request:**

```typescript
{
  email: string; // Valid email
  password: string; // 8–128 chars
  displayName: string; // 1–50 chars
}
```

**`201` Success:**

```typescript
{
  user: {
    id: string;
    email: string;
    displayName: string;
  }
  accessToken: string; // JWT, 15min expiry
}
```

**Errors:** `400` validation | `409` email taken

---

### `POST /api/auth/login` — Authenticate

**Request:**

```typescript
{
  email: string;
  password: string;
}
```

**`200` Success:** Same shape as register.

**Errors:** `400` validation | `401` invalid credentials

---

## Conversation Endpoints

### `GET /api/conversations` — List my conversations

**Auth:** Required  
**Query:** None (MVP)

**`200` Success:**

```typescript
{
  id: string;           // UUID
  type: "DIRECT" | "GROUP";
  name: string | null;  // null for DIRECT
  members: { id: string; displayName: string; avatarUrl: string | null }[];
  lastMessage: { content: string | null; senderId: string; createdAt: string } | null;
  updatedAt: string;    // ISO 8601
}[]
```

**Errors:** `401` unauthorized

---

### `POST /api/conversations` — Create conversation

**Auth:** Required

**Request:**

```typescript
{
  type: "DIRECT" | "GROUP";
  name?: string;              // Required for GROUP (1–100 chars)
  memberIds: string[];        // Excluding self
  // DIRECT: exactly 1 memberId
  // GROUP: 1+ memberIds
}
```

**`201` Success:**

```typescript
{
  conversation: {
    id: string;
    type: "DIRECT" | "GROUP";
    name: string | null;
    members: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    }
    [];
    createdAt: string;
    updatedAt: string;
  }
  isNew: boolean; // false if existing DIRECT conversation returned
}
```

**Errors:** `400` validation | `401` unauthorized

---

### `GET /api/conversations/:id` — Get conversation details

**Auth:** Required

**`200` Success:**

```typescript
{
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  members: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  }
  [];
  createdAt: string;
  updatedAt: string;
}
```

**Errors:** `401` unauthorized | `404` not found / not a member

---

### `DELETE /api/conversations/:id` — Delete conversation

**Auth:** Required  
**Response:** `204 No Content` (no body)

**Errors:** `401` unauthorized | `404` not found / not a member

---

## Message Endpoints

### `GET /api/conversations/:id/messages` — Paginated messages

**Auth:** Required

**Query:**

```typescript
{
  cursor?: string;  // ISO timestamp of oldest loaded message
  limit?: number;   // 1–100, default 50
}
```

**`200` Success:**

```typescript
{
  messages: {
    id: string;
    conversationId: string;
    sender: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    }
    type: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
    content: string | null;
    fileUrl: string | null;
    thumbnailUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    createdAt: string; // ISO 8601
  }
  [];
  nextCursor: string | null; // null = no more pages
}
```

**Errors:** `401` unauthorized | `403` not a member

---

### `POST /api/conversations/:id/messages` — Send message (HTTP fallback)

**Auth:** Required

**Request:**

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

**`201` Success:** Single `Message` object (same shape as above).

**Errors:** `400` validation | `401` unauthorized | `403` not a member

---

### `PATCH /api/messages/:id` — Edit message

**Auth:** Required

**Request:**

```typescript
{
  content: string; // New content
}
```

**`200` Success:** Updated `Message` object.

**Errors:** `400` validation | `401` unauthorized | `403` not the sender | `404`

---

### `DELETE /api/messages/:id` — Delete message

**Auth:** Required  
**Response:** `204 No Content`

**Errors:** `401` unauthorized | `403` not the sender | `404`

---

## Upload Endpoint

### `POST /api/upload` — Upload file to ImageKit

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Request:**

```
file: File  // The file to upload
```

**`201` Success:**

```typescript
{
  url: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
}
```

**Errors:** `400` no file | `401` unauthorized

---

## Video Call Endpoints

### `POST /api/calls/rooms` — Create Daily.co room

**Auth:** Required

**Request:**

```typescript
{
  conversationId: string; // UUID
}
```

**`201` Success:**

```typescript
{
  roomUrl: string;
  roomName: string;
}
```

**Errors:** `400` validation | `401` unauthorized

---

### `GET /api/calls/rooms/:name` — Get room status

**Auth:** Required

**`200` Success:**

```typescript
{
  roomUrl: string;
  roomName: string;
  active: boolean; // Participants currently in call?
}
```

**Errors:** `401` unauthorized | `404`

---

## Status Code Summary

| Code  | Meaning                          |
| ----- | -------------------------------- |
| `200` | Success (GET, PATCH)             |
| `201` | Created (POST)                   |
| `204` | No Content (DELETE)              |
| `400` | Validation error                 |
| `401` | Missing / invalid token          |
| `403` | Not authorized for this resource |
| `404` | Resource not found               |
| `409` | Conflict (email taken)           |

# API

Base URL: `http://localhost:3000`  
Auth: `Authorization: Bearer <access_token>` (required on all except `/api/auth/*`)

Error shape: `{ error: string, details?: unknown[] }`

## Auth

### `POST /api/auth/register`

```
Request:  { email, password, displayName }
201:      { user: { id, email, displayName }, accessToken }
Errors:   400 validation, 409 email taken
```

### `POST /api/auth/login`

```
Request:  { email, password }
200:      { user: { id, email, displayName }, accessToken }
Errors:   400 validation, 401 invalid credentials
```

## Conversations

### `GET /api/conversations` — List mine

```
200: ConversationSummary[]  (ordered by most recent activity)
```

### `POST /api/conversations` — Create

```
Request:  { type: "DIRECT"|"GROUP", name?, memberIds[] }
201:      { conversation: Conversation, isNew: boolean }
Rules:    DIRECT → 1 memberId, GROUP → 1+ memberIds + name required
         Duplicate DIRECT returns existing conversation (isNew: false)
```

### `GET /api/conversations/:id` — Get details

```
200: Conversation
Errors: 403 not a member, 404 not found
```

### `DELETE /api/conversations/:id`

```
204: No Content
```

## Messages

### `GET /api/conversations/:id/messages` — Paginated

```
Query:    cursor? (ISO timestamp), limit? (1-100, default 50)
200:      { messages: Message[], nextCursor: string | null }
```

### `POST /api/conversations/:id/messages` — HTTP fallback

```
Request:  { type, content?, fileUrl?, thumbnailUrl?, fileName?, fileSize? }
201:      Message
Note:     Primary path is Socket.IO `message:send` event
```

### `PATCH /api/messages/:id` — Edit

```
Request:  { content }
200:      Message
Errors:   403 not the sender
```

### `DELETE /api/messages/:id`

```
204: No Content
Errors: 403 not the sender
```

## Upload

### `POST /api/upload`

```
Content-Type: multipart/form-data
Request:  file: File
201:      { url, thumbnailUrl, fileName, fileSize }
```

## Calls

### `POST /api/calls/rooms`

```
Request:  { conversationId }
201:      { roomUrl, roomName }
```

### `GET /api/calls/rooms/:name`

```
200: { roomUrl, roomName, active: boolean }
```

## Status Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 200  | Success (GET, PATCH)       |
| 201  | Created (POST)             |
| 204  | No Content (DELETE)        |
| 400  | Validation error           |
| 401  | Missing / invalid token    |
| 403  | Not authorized for resource |
| 404  | Resource not found         |
| 409  | Conflict (email taken)     |

# Specification 04: REST API Endpoint Contracts

This document contains the complete, type-safe API schema contracts for the system's REST endpoints, including registration, authentication, conversation management, messages, and call creation.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1. `POST /api/auth/register` (Public)
* **Description**: Registers a new user account, creates initial profiles, and issues sessions.
* **Request Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "developer@domain.com",
    "password": "HighEntropySecretPassword123!",
    "displayName": "Alex Dev"
  }
  ```
* **Success Response (201 Created)**:
  * **Cookies**: `refreshToken=<token_string>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth`
  * **Body**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
        "email": "developer@domain.com",
        "displayName": "Alex Dev",
        "avatarUrl": null
      }
    }
    ```

### 2. `POST /api/auth/login` (Public)
* **Description**: Validates credentials, issues JWT access tokens, and sets refresh cookies.
* **Request Body**:
  ```json
  {
    "email": "developer@domain.com",
    "password": "HighEntropySecretPassword123!"
  }
  ```
* **Success Response (200 OK)**:
  * **Cookies**: `refreshToken=<token_string>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth`
  * **Body**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
        "email": "developer@domain.com",
        "displayName": "Alex Dev",
        "avatarUrl": null
      }
    }
    ```

### 3. `POST /api/auth/refresh` (Public)
* **Description**: Performs cryptographic refresh token rotation, invalidating old refresh hashes and returning fresh access keys.
* **Request Cookie**: `refreshToken=<token_string>`
* **Success Response (200 OK)**:
  * **Cookies**: `refreshToken=<new_token_string>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth`
  * **Body**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

### 4. `POST /api/auth/logout` (Protected)
* **Description**: Invalidates active refresh token, deletes database entries, and clears client cookies.
* **Success Response (200 OK)**:
  * **Headers**: `Set-Cookie: refreshToken=; Path=/api/auth; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  * **Body**:
    ```json
    {
      "success": true
    }
    ```

### 5. `GET /api/auth/imagekit` (Protected)
* **Description**: Generates temporary cryptographic authentication credentials for client-side uploads.
* **Success Response (200 OK)**:
  ```json
  {
    "signature": "c56b82ad0e4e5...",
    "token": "7ac984e1-25ef...",
    "expire": 1779384820
  }
  ```

---

## 2. Conversation Endpoints (`/api/conversations`)

### 1. `GET /api/conversations` (Protected)
* **Description**: Fetches all conversations the logged-in user belongs to, ordered by the most recent message's timestamp.
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
      "type": "DIRECT",
      "name": null,
      "members": [
        {
          "userId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
          "displayName": "Alex Dev",
          "lastReadAt": "2026-05-20T16:00:00Z"
        },
        {
          "userId": "b3f88219-c035-430b-93ae-c98f5aee933a",
          "displayName": "Jane Smith",
          "lastReadAt": "2026-05-20T16:15:00Z"
        }
      ],
      "lastMessage": {
        "id": "f8a93e32-2cb5-4f3b-b2b9-aa93ceb1ef01",
        "senderId": "b3f88219-c035-430b-93ae-c98f5aee933a",
        "type": "TEXT",
        "content": "Did you see the new mockups?",
        "createdAt": "2026-05-20T16:20:00Z"
      },
      "unreadCount": 1
    }
  ]
  ```

### 2. `POST /api/conversations` (Protected)
* **Description**: Spins up a conversation channel. For `DIRECT` conversations, if a channel with these two exact members already exists, it is returned instead of creating a duplicate.
* **Request Body**:
  ```json
  {
    "userIds": ["b3f88219-c035-430b-93ae-c98f5aee933a"],
    "type": "DIRECT",
    "name": null
  }
  ```
* **Success Response (201 Created)**: Returns the complete Conversation model.

### 3. `GET /api/conversations/:id/messages` (Protected)
* **Description**: Returns cursor-paginated chat history.
* **Query Parameters**:
  - `before`: Message UUID. Represents the cursor (oldest message currently loaded on client).
  - `limit`: Integer (Default `50`).
* **Success Response (200 OK)**:
  ```json
  {
    "messages": [
      {
        "id": "f8a93e32-2cb5-4f3b-b2b9-aa93ceb1ef01",
        "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
        "senderId": "b3f88219-c035-430b-93ae-c98f5aee933a",
        "type": "TEXT",
        "content": "Did you see the new mockups?",
        "fileUrl": null,
        "createdAt": "2026-05-20T16:20:00Z"
      }
    ],
    "nextCursor": "f8a93e32-2cb5-4f3b-b2b9-aa93ceb1ef01"
  }
  ```

---

## 3. Messaging & Media Endpoints (`/api/conversations/:id/messages`)

### 1. `POST /api/conversations/:id/messages` (Protected)
* **Description**: Submits a text message to the channel, records it in PostgreSQL, and broadcasts it to all active WebSocket clients.
* **Request Body**:
  ```json
  {
    "content": "Meeting started, joining now!"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": "ca8d3e21-0a25-4c07-88eb-10900bb4a9ee",
    "conversationId": "7ac984e1-25ef-4cb4-a1cf-d07b46ff650a",
    "senderId": "e0d37e2a-0a25-4c07-88eb-10900bb4a9ee",
    "type": "TEXT",
    "content": "Meeting started, joining now!",
    "createdAt": "2026-05-20T16:22:00Z"
  }
  ```

### 2. `POST /api/conversations/:id/messages/media` (Protected)
* **Description**: Persists metadata for uploaded files, maps client-side optimistic templates to server records, and broadcasts the asset details.
* **Request Body**:
  ```json
  {
    "type": "IMAGE",
    "fileUrl": "https://ik.imagekit.io/bettercomm/conversations/uuid/image.jpg",
    "thumbnailUrl": "https://ik.imagekit.io/bettercomm/conversations/uuid/image.jpg?tr=w-200,h-200,fo-auto",
    "fileName": "screenshot.jpg",
    "fileSize": 142050,
    "tempId": "opt-uuid-12345"
  }
  ```
* **Success Response (201 Created)**: Returns the complete Message record containing the real database UUID.

---

## 4. Telephony Calling Endpoints (`/api/conversations/:id/call`)

### 1. `POST /api/conversations/:id/call` (Protected)
* **Description**: Provisions an ephemeral Daily.co room for group calls and broadcasts incoming call notifications.
* **Success Response (200 OK)**:
  ```json
  {
    "roomUrl": "https://bettercomm.daily.co/chat-room-7ac984e1"
  }
  ```

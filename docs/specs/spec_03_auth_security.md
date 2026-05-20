# Specification 03: Authentication & Session Security

This document outlines the dual-token architecture, cryptographic rotation rules, secure cookie attributes, middleware protection layers, and WebSocket connection handshakes.

---

## 1. Dual-Token Architecture & Lifecycle

Authentication relies on two separate tokens with highly specialized delivery and lifecycle parameters.

```
┌───────────────────────────────────┬───────────────────────────────────┐
│ Feature                           │ JWT Access Token                  │ Refresh Token                     │
├───────────────────────────────────┼───────────────────────────────────┼───────────────────────────────────┤
│ **Storage Location**              │ Volatile JavaScript Memory        │ HTTPOnly HTTP-secure Cookie       │
│ **Lifespan**                      │ 15 Minutes                        │ 7 Days                            │
│ **Delivery Vector**               │ JSON HTTP Response Body           │ `Set-Cookie` HTTP Headers         │
│ **Usage**                         │ `Authorization: Bearer <token>`   │ Sent automatically in API requests│
│ **Sign Signature**                │ Signed using `JWT_SECRET`         │ Saved as SHA-256 DB hash          │
└───────────────────────────────────┴───────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Cryptographic Rotation & Security Alarms

To completely prevent session hijacking and replay attacks via stolen tokens, we implement a strict **Single-Use Rotation Flow**:

1. **Exchange Request**: To acquire a new Access Token after the 15-minute window expires, the client hits `/api/auth/refresh`. The browser automatically includes the HTTPOnly `refreshToken` cookie.
2. **Database Lookup**:
   - The backend hashes the received refresh token using SHA-256.
   - It searches for the resulting `tokenHash` in the `refresh_tokens` table.
3. **Detection of Replay Attack (Security Alarm)**:
   - If the refresh token was already used or doesn't exist, **immediate defensive measures trigger**:
     - The server assumes a malicious actor is attempting to replay a stolen token.
     - **Action**: Delete all active refresh tokens associated with the matching user ID from the database.
     - Clear the client's cookie and return HTTP `403 Forbidden`. This instantly logs out all active tabs and devices for this user.
4. **Successful Rotation**:
   - If the `tokenHash` is found and hasn't expired:
     - Generate a new, high-entropy refresh token string.
     - Save its SHA-256 hash in a new `refresh_tokens` row.
     - Delete the old token record.
     - Return the brand new refresh token in a secure cookie, and respond with a new 15-minute JWT Access Token.

---

## 3. Strict Cookie Attributes

The refresh token cookie must be configured with the following flags to prevent scripting extraction (XSS) and cross-site request forgery (CSRF):

```typescript
const cookieOptions = {
  httpOnly: true,              // Prevents access via client-side document.cookie
  secure: process.env.NODE_ENV === 'production', // Forces transmission only over HTTPS
  sameSite: 'strict' as const, // Blocks inclusion in third-party/cross-site requests
  path: '/api/auth',           // Restricts transmission to authentication endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (in milliseconds)
};
```

---

## 4. API Authorization Middleware

A Next.js server middleware intercepts requests to secure paths.

```
Request ──► Middleware Interceptor ──► Valid Bearer JWT? ──► [YES] ──► Forward to API Route
                                                │
                                              [NO]
                                                ▼
                                    Return HTTP 401 Unauthorized
```

- All endpoints nested under `/api/*` (excluding path exceptions `/api/auth/login`, `/api/auth/register`, and `/api/auth/refresh`) must be protected by the auth middleware.
- The middleware inspects the request header for `Authorization: Bearer <accessToken>`.
- The token is decrypted using the cryptographically secure `JWT_SECRET`. If signature validation fails, return `401 Unauthorized`.

---

## 5. Secure WebSocket Handshakes

Standard WebSockets do not support custom request headers during the initial TCP handshake connection upgrade. 

We secure the WS gateway with a robust authentication protocol:
1. **Handshake Verification**: The client must supply their active in-memory JWT Access Token in the upgrade URL's query string:
   `ws://localhost:3000/ws?token=<accessToken>`
2. **Instant Termination**: The WebSocket server parses and validates the token parameters during the upgrade phase. If validation fails, the connection is instantly rejected with close code `4001` (Unauthorized) before any data frames can be transmitted.

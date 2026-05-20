# Specification 06: Media Processing & Cloud Storage Pipeline

This document specifies the direct cloud upload process, cryptographic signatures, client-side limits, and dynamic URL transformations for image and video delivery using ImageKit.io.

---

## 1. High-Performance Direct Cloud Upload

Rather than routing uploads through the Next.js API (which introduces bandwidth bottlenecks, CPU load from image processing, and server timeouts), Better-Communication routes heavy files directly to ImageKit.io.

```
[Client SPA]                             [Next.js API Routes]            [ImageKit.io CDN]
      │                                            │                             │
      ├─ (1) Fetch Ephemeral Auth Tokens ─────────►│                             │
      │◄─ (2) Return Signature, Token, Expiry ─────┤                             │
      │                                                                          │
      ├─ (3) Display Optimistic Blob URL                                         │
      │                                                                          │
      ├─ (4) Direct Browser-to-Cloud Upload ────────────────────────────────────►│
      │◄─ (5) Return Upload Metadata (fileUrl, etc.) ────────────────────────────┤
      │                                                                          │
      ├─ (6) POST /api/conversations/:id/messages/media ─►│                      │
      │      (Saves file details, broadcasts message)     │                      │
      │◄─ (7) Reconcile temp ID, resolve upload states ───┤                      │
```

---

## 2. Ephemeral Signature Authentication Protocol

To securely upload directly from the browser, the client must verify its identity with ImageKit using temporary, server-generated cryptographic keys.

1. **Backend Signature Endpoint (`GET /api/auth/imagekit`)**:
   - Generates an ephemeral cryptographic package using `IMAGEKIT_PRIVATE_KEY`.
   - Returns a structured verification signature:
     ```json
     {
       "signature": "c56b82ad0e4e5...",
       "token": "7ac984e1-25ef...",
       "expire": 1779384820
     }
     ```
2. **Client Upload Payload**:
   - The browser sends a `multipart/form-data` request directly to:
     `https://upload.imagekit.io/api/v1/files/upload`
   - Include key parameters:
     - `file`: The raw binary blob.
     - `publicKey`: `IMAGEKIT_PUBLIC_KEY`
     - `signature`, `token`, `expire`: The ephemeral values fetched in step 1.
     - `fileName`: A randomized string to prevent file path collisions (e.g., `uuid-originalName.ext`).
     - `folder`: Set path structure (e.g., `/conversations/{conversationId}/messages/`).

---

## 3. Client-Side Size Filtering Limits

To optimize cloud storage usage and network bandwidth, the client filters file types and limits sizes in the browser before triggering uploads:

- **`IMAGE`**: Max **10MB**. Restrict formats to `image/jpeg`, `image/png`, `image/webp`, and `image/gif`.
- **`VIDEO`**: Max **50MB**. Restrict formats to `video/mp4` and `video/webm`.
- **`FILE`**: Max **100MB**. Accept other common formats (e.g., `application/pdf`, `.zip`, `.docx`).

---

## 4. Dynamic URL Transformation Engine

ImageKit.io generates previews, thumbnails, and optimized streaming formats on-the-fly via URL parameters, shifting media processing costs to the cloud CDN.

### 1. Image Thumbnails (`?tr=w-200,h-200,fo-auto`)
Instead of processing thumbnails on the server using `sharp`, we append real-time image parameters to the ImageKit CDN URL:
- **Base URL**: `https://ik.imagekit.io/bettercomm/conversations/7ac984e1/screenshot.jpg`
- **Thumbnail URL**: `https://ik.imagekit.io/bettercomm/conversations/7ac984e1/screenshot.jpg?tr=w-200,h-200,fo-auto`
- **Transformations**:
  - `w-200,h-200`: Resizes the target image to `200x200px`.
  - `fo-auto`: Triggers smart subject cropping to automatically center faces or important objects.

### 2. Video Preview Poster (`?tr=so-1`)
Extracting video frames no longer requires local `ffmpeg` executions. We capture the first frame poster directly from ImageKit's media server:
- **Base Video**: `https://ik.imagekit.io/bettercomm/conversations/7ac984e1/recording.mp4`
- **Video Thumbnail**: `https://ik.imagekit.io/bettercomm/conversations/7ac984e1/recording.mp4?tr=so-1`
- **Transformations**:
  - `so-1` (Start Offset 1s): Captures the video frame exactly 1 second in, serving it as a lightweight WebP image.

# Step-by-Step Developer Setup & Build Guide

Welcome to the step-by-step developer manual for **Better-Communication**. If you are looking at a blank screen and don't know where to start, this guide will walk you through setting up, configuring, and building this application from scratch.

---

## 🛠️ Step 1: Environment Setup (`.env`)

Before writing any code, we must configure our local environment keys so Prisma, Next.js, and WebSocket adapters can authenticate:

1. Create a new file in the root directory named `.env`:
   ```bash
   touch .env
   ```
2. Open the newly created `.env` file and paste the following baseline template, replacing placeholders with your actual credentials:
   ```bash
   # PostgreSQL Local or Production URL
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/better_comm?schema=public"

   # Cryptographic Signatures (Generate via: openssl rand -base64 32)
   JWT_SECRET="super-secret-high-entropy-signature-key-256-bit"
   JWT_REFRESH_SECRET="secondary-high-entropy-rotator-signature-key-512-bit"

   # ImageKit.io Credentials (Sign up for a free account at imagekit.io)
   IMAGEKIT_PUBLIC_KEY="public_your_imagekit_public_key..."
   IMAGEKIT_PRIVATE_KEY="private_your_imagekit_private_key..."
   IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id/"

   # Daily.co API Integration (Sign up for free video calling rooms at daily.co)
   DAILY_API_KEY="api_key_obtained_from_daily_dashboard"
   ```

---

## 🗄️ Step 2: Database Scaffolding & Initial Migration

Prisma has already been installed and initialized with the required specifications. Now, let's create the physical database tables and indexes:

1. **Verify your local PostgreSQL server is running** (or use a hosted DB link in `DATABASE_URL`).
2. **Execute the initial migration**:
   This command reads the models inside [prisma/schema.prisma](../specs/spec_02_database.md), generates the physical SQL tables in your PostgreSQL database, and builds the composite chronological indexes:
   ```bash
   npm run prisma:migrate --name init
   ```
3. **Verify the database tables**:
   Launch the visual editor to explore the empty tables and confirm the relational mappings are successfully constructed:
   ```bash
   npm run prisma:studio
   ```

---

## 🔒 Step 3: Scaffolding JWT & Session Security

Next, we establish secure authentication before building standard UI panels.

1. **Create Auth Helper Utilities**:
   Create a utility folder `app/lib/auth.ts` or `app/lib/jwt.ts` to manage:
   - Creating JWT tokens using `jose` or `jsonwebtoken`.
   - Utility checks for secure password hashing using `bcrypt`.
2. **Build API Route Handlers**:
   Create folders and route files matching Next.js App Router rules under `/app/api/auth/`:
   - `app/api/auth/register/route.ts` - Validates email/password, hashes passwords, pushes user row to DB.
   - `app/api/auth/login/route.ts` - Validates passwords against hashes, generates JWT, sets the HTTPOnly `refreshToken` cookie.
   - `app/api/auth/refresh/route.ts` - Performs Single-Use Refresh Token Rotation.
   - `app/api/auth/logout/route.ts` - Clears the database refresh token row and resets client cookies.

---

## 🔌 Step 4: Real-Time WebSocket Thread Setup

1. **Custom Server Configuration**:
   Create a custom server file in your root folder (e.g., `server.mjs`) to bind a standard `ws` (WebSocket) server thread alongside the Next.js runtime listener.
2. **Token Security checks**:
   In the connection upgrade hook, read the URL parameters (`?token=<token>`), decode the JWT signature, and reject connections with close code `4001` if authentication fails.
3. **Registry Management**:
   Maintain a live registry mapping User IDs to WebSocket sets, handle channel subscriptions, typing broadcasts, and WebRTC signal transfers.

---

## 🎨 Step 5: High-Fidelity UI Foundations & Layout

With security and network pipelines set up, you can now construct your visual interface:

1. **Configure Custom Themes & Variables**:
   Open `/app/globals.css` and configure the HSL color palette variables, modern scrolling layouts, active glassmorphic panels, and bouncing typing micro-animations detailed in the [Design Specification](../specs/spec_01_architecture.md).
2. **Build Responsive Panels**:
   Design the layout grid inside `app/layout.tsx` and `app/page.tsx`:
   - Set a primary flex container.
   - **Desktop**: Create a persistent sidebar (width: `350px`) hosting live channels, user states, and unread badges, flanked by the main active chat area.
   - **Mobile**: Support responsive collapsing sliding actions triggered by standard state classes.

---

## 📷 Step 6: Direct ImageKit Cloud Upload Pipeline

1. **Signature Generator Route**:
   Build the endpoint `app/api/auth/imagekit/route.ts` using the ImageKit Node SDK to sign ephemeral upload credentials (`signature`, `token`, `expire`) using `IMAGEKIT_PRIVATE_KEY`.
2. **Browser Uploader Component**:
   Write a client-side utility in `app/components/ChatInput.tsx` to handle file selection:
   - Apply file size limits (10MB image, 50MB video, 100MB file).
   - Display a temporary optimistic bubble containing a local blob URL and uploading indicator.
   - Dispatch signatures and upload directly to ImageKit's API endpoints.
3. **Database Sync API**:
   Create `app/api/conversations/[id]/messages/media/route.ts` to record completed file URLs and broadcast files to members.

---

## 📞 Step 7: WebRTC Direct Calls Integration

1. **Create WebRTC Call Context Hooks**:
   Establish a React Context (`app/context/CallContext.tsx`) managing `RTCPeerConnection` lifecycles.
2. **Wire Up Handshake Messaging**:
   Listen to WebSocket signaling streams (`call_offer`, `call_answer`, `ice_candidate`) and delegate streams dynamically to incoming `<video>` streams.
3. **Provision Daily.co for Groups**:
   Implement a Next.js REST API controller creating ephemeral calling rooms via Daily.co REST APIs.

---

## 🚀 Running Your Application Localy

1. **Launch the development environment**:
   ```bash
   npm run dev
   ```
2. Open your web browser and navigate to:
   `http://localhost:3000`
3. Log in, open multiple browser contexts to test the real-time chat, and start building!

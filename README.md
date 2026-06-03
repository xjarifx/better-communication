# Better Communication

## What is this project?

A real-time messaging and P2P video calling app. Supports direct and group chats with typing indicators, file sharing, and WebRTC-based video calls. Built with Next.js, Socket.IO, and PostgreSQL.

## How do I use it?

```bash
git clone https://github.com/xjarifx/better-communication.git
cd better-communication
npm install
cp .env.example .env   # fill in DATABASE_URL + ImageKit keys
npm run prisma:migrate
npm run dev             # starts Next.js (port 3000) + Socket.IO (port 3001)
```

Open `http://localhost:3000`. Use the demo login (`jarif@gmail.com` / same as password) to test instantly.

## Where do I find more details?

| Topic          | File                    |
| -------------- | ----------------------- |
| Architecture   | [docs/architecture.md](docs/architecture.md)  |
| Database model | [docs/database.md](docs/database.md)          |
| API reference  | [docs/api.md](docs/api.md)                    |

import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import * as Sentry from "@sentry/node";
import { socketAuth } from "./socket-auth";
import { registerHandlers } from "./socket-handlers";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 0,
  });
}

const PORT = parseInt(process.env.PORT ?? process.env.SOCKET_PORT ?? "3001", 10);
const CORS_ORIGIN = process.env.NODE_ENV === "production"
  ? (process.env.CORS_ORIGIN ?? "*")
  : "*";

const httpServer = http.createServer();

// Health check for Render load balancer
httpServer.on("request", (req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  }
});

export const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  socket.onAny((event) => {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      dir: "in",
      event,
      userId: socket.data.user?.userId,
      socketId: socket.id,
    }));
  });

  const originalEmit = socket.emit.bind(socket);
  socket.emit = (event: string, ...args: unknown[]) => {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      dir: "out",
      event,
      userId: socket.data.user?.userId,
      socketId: socket.id,
    }));
    return originalEmit(event, ...args);
  };
});

registerHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

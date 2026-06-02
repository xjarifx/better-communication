import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import { socketAuth } from "./socket-auth";
import { registerHandlers } from "./socket-handlers";

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
registerHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

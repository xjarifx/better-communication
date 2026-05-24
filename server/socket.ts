import http from "http";
import { Server } from "socket.io";
import { socketAuth } from "./socket-auth";
import { registerHandlers } from "./socket-handlers";

const PORT = parseInt(process.env.SOCKET_PORT ?? "3001", 10);

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.use(socketAuth);
registerHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});

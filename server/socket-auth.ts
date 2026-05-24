import { verifyAccessToken } from "../lib/jwt";
import type { Socket } from "socket.io";

export function socketAuth(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;

  console.log(`[socket-auth] Auth attempt. Token received: ${token ? `yes (${token.slice(0, 20)}...)` : "NO"}`);

  if (!token) {
    console.error(`[socket-auth] No token provided!`);
    return next(new Error("Authentication failed"));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    console.log(`[socket-auth] Auth successful for user ${payload.userId}`);
    next();
  } catch (error) {
    console.error(`[socket-auth] Token verification failed:`, error);
    next(new Error("Authentication failed"));
  }
}

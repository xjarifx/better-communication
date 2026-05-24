import { verifyAccessToken } from "../lib/jwt";
import type { Socket } from "socket.io";

export function socketAuth(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;

  console.log(`[socket-auth] Auth attempt from ${socket.id}`, {
    tokenExists: !!token,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token ? `${token.slice(0, 20)}...` : "MISSING",
  });

  if (!token) {
    console.error(`[socket-auth] ❌ No token provided! Socket ID: ${socket.id}`);
    return next(new Error("Authentication failed: No token provided"));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    console.log(`[socket-auth] ✅ Auth successful for user ${payload.userId}, Socket ID: ${socket.id}`);
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[socket-auth] ❌ Token verification failed for ${socket.id}:`, errorMsg);
    next(new Error(`Authentication failed: ${errorMsg}`));
  }
}

import { verifyAccessToken } from "../lib/jwt";
import type { Socket } from "socket.io";

export function socketAuth(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication failed"));
  }

  try {
    socket.data.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
}

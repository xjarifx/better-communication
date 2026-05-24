import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET environment variable not set");
  }

  console.log("[jwt] Signing token for user:", payload.userId);
  return jwt.sign(payload, secret, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN! as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET environment variable not set");
  }

  try {
    console.log("[jwt] Verifying token...");
    const payload = jwt.verify(token, secret) as AccessTokenPayload;
    console.log("[jwt] Token verified successfully for user:", payload.userId);
    return payload;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[jwt] Token verification failed:", message);
    throw new Error(`Invalid access token: ${message}`);
  }
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    console.log("[jwt] Decoding token (without verification)...");
    const payload = jwt.decode(token) as AccessTokenPayload | null;
    if (payload) {
      console.log("[jwt] Token decoded successfully for user:", payload.userId);
    }
    return payload;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[jwt] Token decode failed:", message);
    return null;
  }
}

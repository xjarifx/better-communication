import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN! as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET environment variable not set");
  }

  try {
    return jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
    ) as AccessTokenPayload;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid access token: ${message}`);
  }
}

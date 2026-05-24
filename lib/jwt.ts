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
  try {
    return jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as AccessTokenPayload;
  } catch (err) {
    throw new Error("Invalid access token");
  }
}

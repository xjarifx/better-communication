import type { SignOptions } from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRES_IN } from "./env";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch (err) {
    throw new Error("Invalid access token");
  }
}

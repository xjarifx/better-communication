import { hashPassword } from "../../lib/password";
import {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} from "../../lib/jwt";
import { COOKIE_NAME, COOKIE_OPTIONS } from "../../lib/cookies";
import { REFRESH_TOKEN_EXPIRES_IN } from "../../lib/env";
import { findUserByEmail, createUser, createRefreshToken } from "./repository";
import type { RegisterInput } from "./schema";

export async function registerUser(input: RegisterInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    return { error: "Email already in use" as const, status: 409 };
  }

  const passwordHash = hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    displayName: input.displayName,
  });

  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });
  const tokenHash = hashRefreshToken(refreshToken);

  const expiresInMs = parseDuration(REFRESH_TOKEN_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await createRefreshToken({ userId: user.id, tokenHash, expiresAt });

  return {
    data: {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      accessToken,
    },
    cookie: { name: COOKIE_NAME, value: refreshToken, options: COOKIE_OPTIONS },
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] || 7 * 24 * 60 * 60 * 1000);
}

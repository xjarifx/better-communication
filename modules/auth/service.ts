import { hashPassword, verifyPassword } from "../../lib/password";
import { signAccessToken, decodeAccessToken } from "../../lib/jwt";
import { findUserByEmail, createUser } from "./repository";
import type { RegisterInput, LoginInput } from "./schema";

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

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName },
    accessToken,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    return { error: "Invalid email or password" as const, status: 401 };
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email });

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName },
    accessToken,
  };
}

export async function refreshAccessToken(token: string) {
  try {
    const payload = decodeAccessToken(token);
    
    if (!payload) {
      return { error: "Invalid or expired token" as const, status: 401 };
    }

    const user = await findUserByEmail(payload.email);

    if (!user) {
      return { error: "User not found" as const, status: 401 };
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      accessToken: newAccessToken,
    };
  } catch {
    return { error: "Invalid or expired token" as const, status: 401 };
  }
}

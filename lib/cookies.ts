import { NODE_ENV } from "./env";

export const COOKIE_NAME = "refreshToken";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function getClearCookieOptions() {
  return { ...COOKIE_OPTIONS, maxAge: 0 };
}

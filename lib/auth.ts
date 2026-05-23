import { verifyAccessToken } from "./jwt";
import type { NextRequest } from "next/server";

export function authenticate(request: NextRequest) {
  const header = request.headers.get("Authorization");
  const token = header?.replace("Bearer ", "");

  if (!token) {
    return { error: "Missing authorization token" as const, status: 401 };
  }

  try {
    return { payload: verifyAccessToken(token) };
  } catch {
    return { error: "Invalid or expired token" as const, status: 401 };
  }
}

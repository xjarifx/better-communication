import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "../../../../modules/auth/service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    return Response.json(
      { error: "No access token found" },
      { status: 401 },
    );
  }

  const result = await refreshAccessToken(token);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json(result, { status: 200 });
  response.cookies.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

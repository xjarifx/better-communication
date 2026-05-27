import { NextRequest } from "next/server";
import { authenticate } from "../../../../lib/auth";
import { createDailyRoom } from "../../../../lib/daily";

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();

  if (!body.conversationId || typeof body.conversationId !== "string") {
    return Response.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  const result = createDailyRoom();

  return Response.json(result, { status: 201 });
}

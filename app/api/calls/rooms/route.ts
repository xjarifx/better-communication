import { NextRequest } from "next/server";
import { authenticate } from "../../../../lib/auth";

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

  return Response.json({ conversationId: body.conversationId }, { status: 201 });
}

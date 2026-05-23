import { NextRequest } from "next/server";
import { authenticate } from "../../../lib/auth";
import { CreateConversationSchema } from "../../../modules/conversation/schema";
import {
  listConversations,
  createConversationForUser,
} from "../../../modules/conversation/service";

export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const conversations = await listConversations(auth.payload.userId);
  return Response.json(conversations);
}

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = CreateConversationSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await createConversationForUser(
    parsed.data,
    auth.payload.userId,
  );

  return Response.json(result, { status: 201 });
}

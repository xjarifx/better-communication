import { NextRequest } from "next/server";
import { authenticate } from "../../../../../lib/auth";
import {
  SendMessageSchema,
  MessagesQuerySchema,
} from "../../../../../modules/message/schema";
import {
  listMessages,
  sendMessage,
} from "../../../../../modules/message/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const query = MessagesQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  const result = await listMessages(id, auth.payload.userId, query);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    messages: result.messages,
    nextCursor: result.nextCursor,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = SendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await sendMessage(id, auth.payload.userId, parsed.data);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.message, { status: 201 });
}

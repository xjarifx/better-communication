import { NextRequest } from "next/server";
import { authenticate } from "../../../../lib/auth";
import {
  getConversation,
  removeConversation,
} from "../../../../modules/conversation/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const result = await getConversation(id, auth.payload.userId);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.conversation);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const result = await removeConversation(id, auth.payload.userId);

  if (result && "error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return new Response(null, { status: 204 });
}

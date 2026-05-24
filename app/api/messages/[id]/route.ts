import { NextRequest } from "next/server";
import { authenticate } from "../../../../lib/auth";
import { EditMessageSchema } from "../../../../modules/message/schema";
import {
  editMessage,
  removeMessage,
} from "../../../../modules/message/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = EditMessageSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await editMessage(id, auth.payload.userId, parsed.data);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.message);
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
  const result = await removeMessage(id, auth.payload.userId);

  if (result && "error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return new Response(null, { status: 204 });
}

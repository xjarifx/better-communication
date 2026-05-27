import { NextRequest } from "next/server";
import { authenticate } from "@/lib/auth";
import { AddMembersSchema } from "@/modules/conversation/schema";
import {
  addMembersToConversation,
  removeMemberFromConversation,
} from "@/modules/conversation/service";

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
  const parsed = AddMembersSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await addMembersToConversation(
    id,
    parsed.data,
    auth.payload.userId,
  );

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result, { status: 200 });
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
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId query parameter is required" }, { status: 400 });
  }

  const result = await removeMemberFromConversation(
    id,
    userId,
    auth.payload.userId,
  );

  if (result && "error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return new Response(null, { status: 204 });
}

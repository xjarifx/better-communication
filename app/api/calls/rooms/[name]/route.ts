import { NextRequest } from "next/server";
import { authenticate } from "../../../../../lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { name } = await params;

  return Response.json({ conversationId: name, active: true });
}

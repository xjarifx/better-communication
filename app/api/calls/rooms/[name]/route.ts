import { NextRequest } from "next/server";
import { authenticate } from "../../../../../lib/auth";
import { getJitsiRoom } from "../../../../../lib/jitsi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { name } = await params;

  const result = getJitsiRoom(name);

  return Response.json(result);
}

import { NextRequest } from "next/server";
import { authenticate } from "../../../../../lib/auth";
import { getDailyRoom } from "../../../../../lib/daily";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { name } = await params;

  const result = await getDailyRoom(name);

  if ("error" in result) {
    return Response.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return Response.json(result);
}

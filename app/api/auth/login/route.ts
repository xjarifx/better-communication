import { NextRequest } from "next/server";
import { LoginSchema } from "../../../../modules/auth/schema";
import { loginUser } from "../../../../modules/auth/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await loginUser(parsed.data);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result, { status: 200 });
}

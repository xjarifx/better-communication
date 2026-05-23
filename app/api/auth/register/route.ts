import { NextRequest } from "next/server";
import { RegisterSchema } from "../../../../modules/auth/schema";
import { registerUser } from "../../../../modules/auth/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await registerUser(parsed.data);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result, { status: 201 });
}

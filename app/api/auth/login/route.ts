import { NextRequest } from "next/server";
import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  cookieStore.set(
    result.cookie.name,
    result.cookie.value,
    result.cookie.options,
  );

  return Response.json(result.data, { status: 200 });
}

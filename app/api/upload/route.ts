import { NextRequest } from "next/server";
import { authenticate } from "../../../lib/auth";
import { uploadToImageKit } from "../../../lib/imagekit";

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await uploadToImageKit(file);

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result, { status: 201 });
}

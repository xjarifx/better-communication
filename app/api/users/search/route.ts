import { NextRequest } from "next/server";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = authenticate(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const users = await prisma.user.findMany({
    where: {
      id: { not: auth.payload.userId },
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
    take: 20,
  });

  return Response.json(users);
}

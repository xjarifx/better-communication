import { prisma } from "../../lib/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  displayName: string;
}) {
  return prisma.user.create({ data });
}

export async function createRefreshToken(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.refreshToken.create({ data });
}

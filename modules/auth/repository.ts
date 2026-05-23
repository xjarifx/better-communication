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

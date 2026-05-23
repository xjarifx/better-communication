import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { DATABASE_URL, NODE_ENV } from "./env";

const isDev = NODE_ENV === "development";
const isProd = NODE_ENV === "production";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: isDev ? ["query", "warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) {
  globalForPrisma.prisma = prisma;
}

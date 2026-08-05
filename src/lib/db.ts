import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton — without this, every hot reload
// opens a fresh PrismaClient and you exhaust Postgres connections in
// about ten minutes of active development.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

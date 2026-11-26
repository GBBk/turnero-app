import { PrismaClient } from "@prisma/client";

// En desarrollo, Next recarga módulos en caliente y crearía un PrismaClient
// nuevo en cada cambio, agotando las conexiones. Guardamos una sola instancia
// en globalThis para reutilizarla.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

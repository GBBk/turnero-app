import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

// Conexión:
// - DATABASE_URL es la URL *pooled* de Neon (host con "-pooler", PgBouncer),
//   pensada para tráfico serverless con muchas conexiones cortas.
// - Usamos node-postgres (pg) como driver vía el adapter de Prisma, que es lo que
//   Neon recomienda en Vercel con Fluid compute: el pool se reutiliza entre requests
//   y attachDatabasePool cierra conexiones ociosas antes de que la función se suspenda.
//   Fuera de Vercel attachDatabasePool no hace nada.
// - Las migraciones usan DATABASE_URL_UNPOOLED (ver directUrl en schema.prisma).

function createPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// En desarrollo, Next recarga módulos en caliente y crearía un cliente nuevo
// en cada cambio, agotando las conexiones. Guardamos una sola instancia.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

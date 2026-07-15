import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// connection_limit prevents exhausting Postgres connections under load
const databaseUrl = process.env.DATABASE_URL +
  (process.env.DATABASE_URL?.includes('?') ? '&' : '?') +
  `connection_limit=${process.env.DB_POOL_SIZE || 10}`;

export const prisma = global.prisma ?? new PrismaClient({
  datasources: { db: { url: databaseUrl } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

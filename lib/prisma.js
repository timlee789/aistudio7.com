import { PrismaClient } from '@prisma/client';

// Global Prisma client for serverless environments like Vercel
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: `${process.env.DATABASE_URL}?pgbouncer=true&connection_limit=1&pool_timeout=20&socket_timeout=20`
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
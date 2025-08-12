import { PrismaClient } from '@prisma/client';

// Vercel에서 권장하는 Prisma 설정
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Connection pool 설정으로 prepared statement 충돌 방지
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=1&pool_timeout=0"
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
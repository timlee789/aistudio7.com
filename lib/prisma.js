import { PrismaClient } from '@prisma/client';

// Vercel serverless 환경에 최적화된 단순한 Prisma 클라이언트
let prisma;

if (process.env.NODE_ENV === 'production') {
  // Production: 새로운 클라이언트를 매번 생성 (serverless에 안전)
  prisma = new PrismaClient();
} else {
  // Development: 글로벌 클라이언트 재사용
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
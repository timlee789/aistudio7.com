import { PrismaClient } from '@prisma/client';

// Vercel serverless 환경을 위한 prepared statement 비활성화
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // Prepared statements 비활성화로 Vercel 호환성 개선
    __internal: {
      engine: {
        binaryPath: undefined,
        allowTriggerPanic: false
      }
    }
  });
};

let prisma;

if (process.env.NODE_ENV === 'production') {
  // Production: 매번 새 클라이언트 생성하되 prepared statements 비활성화
  prisma = createPrismaClient();
} else {
  // Development: 글로벌 클라이언트 재사용
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
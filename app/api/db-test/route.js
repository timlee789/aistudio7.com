import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Prepared statement를 피하기 위해 단순한 Prisma 쿼리 사용
    await prisma.$connect();
    
    // 실제 테이블 쿼리로 연결 확인
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'OK',
      message: 'Database connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
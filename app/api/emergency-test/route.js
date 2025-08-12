import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123!@#@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Test: Starting Prisma database test...', uniqueId);
  
  try {
    // Use Prisma with completely isolated instance
    console.log('🔗 Emergency Test: Creating isolated Prisma client...');
    const isolatedPrisma = new PrismaClient({
      datasources: {
        db: { url: EMERGENCY_DB_URL }
      },
      log: ['error']
    });

    console.log('🔗 Emergency Test: Connecting...');
    await isolatedPrisma.$connect();
    console.log('✅ Emergency Test: Connected!');

    // Test with simple raw query first
    console.log('📊 Emergency Test: Testing simple raw query...');
    const result = await isolatedPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Emergency Test: Raw query successful:', result);

    // Test user count
    console.log('📊 Emergency Test: Counting users...');
    const userCount = await isolatedPrisma.user.count();
    console.log('👥 Emergency Test: User count:', userCount);

    // Test admin user
    console.log('🔍 Emergency Test: Finding admin user...');
    const adminUser = await isolatedPrisma.user.findFirst({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log('🔑 Emergency Test: Admin exists:', !!adminUser);

    const response = NextResponse.json({
      success: true,
      message: 'Emergency Prisma database test successful',
      results: {
        userCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role,
        adminEmail: adminUser?.email,
        method: 'PRISMA_ISOLATED',
        databaseUrl: EMERGENCY_DB_URL.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
        uniqueId
      }
    });

    // Always disconnect Prisma client
    try {
      console.log('🔌 Emergency Test: Disconnecting Prisma client...');
      await isolatedPrisma.$disconnect();
      console.log('✅ Emergency Test: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Emergency Test: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Test Error:', error);
    console.error('💥 Error stack:', error.stack);
    
    return NextResponse.json({ 
      success: false,
      error: 'Emergency Prisma test failed', 
      details: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      uniqueId
    }, { status: 500 });
  }
}
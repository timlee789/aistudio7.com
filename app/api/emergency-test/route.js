import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  // Create unique Prisma client with timestamp to force new instance
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Test: Starting database test...', uniqueId);
  
  try {
    // Create completely fresh Prisma client with unique configuration
    console.log('🔗 Emergency Test: Creating fresh Prisma client...');
    const freshPrisma = new PrismaClient({
      datasources: {
        db: { url: EMERGENCY_DB_URL }
      },
      log: ['error']
    });

    console.log('🔗 Emergency Test: Connecting...');
    await freshPrisma.$connect();
    console.log('✅ Emergency Test: Connected!');

    // Test user count
    console.log('📊 Emergency Test: Counting users...');
    const userCount = await freshPrisma.user.count();
    console.log('👥 Emergency Test: User count:', userCount);

    // Test admin user
    console.log('🔍 Emergency Test: Finding admin user...');
    const adminUser = await freshPrisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log('🔑 Emergency Test: Admin exists:', !!adminUser);

    const response = NextResponse.json({
      success: true,
      message: 'Emergency database test successful',
      results: {
        userCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role,
        databaseUrl: EMERGENCY_DB_URL.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
        uniqueId
      }
    });

    // Always disconnect fresh connection immediately
    try {
      console.log('🔌 Emergency Test: Disconnecting...');
      await freshPrisma.$disconnect();
      console.log('✅ Emergency Test: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Emergency Test: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Test Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Emergency test failed', 
      details: error.message,
      timestamp: new Date().toISOString(),
      uniqueId
    }, { status: 500 });
  }
}
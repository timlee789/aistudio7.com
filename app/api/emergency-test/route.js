import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Test: Starting FRESH Prisma database test...', uniqueId);
  
  let isolatedPrisma = null;
  
  try {
    // Force completely new Prisma instance with random schema name to avoid caching
    const randomSchema = `emergency_${uniqueId.replace('.', '_')}`;
    console.log('🔗 Emergency Test: Creating FRESH Prisma client with schema:', randomSchema);
    
    // Use dynamic import to ensure fresh instance
    const { PrismaClient: FreshPrismaClient } = await import('@prisma/client');
    
    isolatedPrisma = new FreshPrismaClient({
      datasources: {
        db: { url: EMERGENCY_DB_URL }
      },
      // Force fresh connection pool
      log: ['error'],
      errorFormat: 'minimal'
    });

    console.log('🔗 Emergency Test: Connecting with fresh instance...');
    await isolatedPrisma.$connect();
    console.log('✅ Emergency Test: Connected!');

    // Skip raw query that causes prepared statement issues
    console.log('📊 Emergency Test: Testing user count directly...');
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
      message: 'Emergency FRESH Prisma database test successful',
      results: {
        userCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role,
        adminEmail: adminUser?.email,
        method: 'FRESH_PRISMA_DYNAMIC_IMPORT',
        databaseUrl: EMERGENCY_DB_URL.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
        uniqueId,
        randomSchema
      }
    });

    // Always disconnect Prisma client IMMEDIATELY
    if (isolatedPrisma) {
      try {
        console.log('🔌 Emergency Test: Disconnecting FRESH Prisma client...');
        await isolatedPrisma.$disconnect();
        console.log('✅ Emergency Test: Disconnected cleanly');
      } catch (disconnectError) {
        console.log('⚠️ Emergency Test: Disconnect error (ignored):', disconnectError.message);
      }
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Test Error:', error);
    console.error('💥 Error stack:', error.stack);
    
    // Ensure disconnect on error
    if (isolatedPrisma) {
      try {
        await isolatedPrisma.$disconnect();
      } catch (disconnectError) {
        console.log('⚠️ Emergency Test: Error disconnecting on failure:', disconnectError.message);
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Emergency FRESH Prisma test failed', 
      details: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      uniqueId
    }, { status: 500 });
  }
}
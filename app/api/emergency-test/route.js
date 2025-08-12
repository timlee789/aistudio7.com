import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  let emergencyPrisma;
  
  try {
    console.log('🚨 Emergency Test: Starting database test...');
    
    // Create emergency Prisma client
    emergencyPrisma = new PrismaClient({
      datasources: {
        db: { url: EMERGENCY_DB_URL }
      }
    });

    console.log('🔗 Emergency Test: Connecting...');
    await emergencyPrisma.$connect();
    console.log('✅ Emergency Test: Connected!');

    // Test user count
    const userCount = await emergencyPrisma.user.count();
    console.log('👥 Emergency Test: User count:', userCount);

    // Test admin user
    const adminUser = await emergencyPrisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log('🔑 Emergency Test: Admin exists:', !!adminUser);

    return NextResponse.json({
      success: true,
      message: 'Emergency database test successful',
      results: {
        userCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role,
        databaseUrl: EMERGENCY_DB_URL.substring(0, 30) + '...',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Emergency Test Error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Emergency test failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    if (emergencyPrisma) {
      await emergencyPrisma.$disconnect();
    }
  }
}
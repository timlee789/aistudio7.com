import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Direct hardcoded URL - bypass all environment variables
const DIRECT_DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

let prisma;

export async function GET() {
  try {
    console.log('🔍 DB Test: Starting database connection test...');
    
    // Check environment variables
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 20) + '...' + process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 20) : 
        'Not found'
    };
    
    console.log('Environment info:', envInfo);
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not found in environment variables',
        envInfo
      }, { status: 500 });
    }
    
    // Create fresh Prisma client with direct URL
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: DIRECT_DATABASE_URL
        }
      }
    });
    
    console.log('🔍 DB Test: Prisma client created, testing connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('🔍 DB Test: Connected to database successfully');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log('🔍 DB Test: User count:', userCount);
    
    // Test finding admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log('🔍 DB Test: Admin user found:', !!adminUser);
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      envInfo,
      results: {
        userCount,
        adminUserExists: !!adminUser,
        adminUserId: adminUser?.id,
        adminUserRole: adminUser?.role
      }
    });
    
  } catch (error) {
    console.error('💥 DB Test: Database connection failed:', error);
    console.error('💥 DB Test: Error name:', error.name);
    console.error('💥 DB Test: Error message:', error.message);
    
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.error('Error disconnecting:', disconnectError);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      errorName: error.name,
      envInfo: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
      }
    }, { status: 500 });
  }
}
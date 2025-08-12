import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Hardcoded DATABASE_URL to bypass Vercel env var issues
const WORKING_DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  let prisma = null;
  
  try {
    console.log('🔍 Table Info API: Creating fresh Prisma client...');
    
    // Create fresh Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: { url: WORKING_DATABASE_URL }
      },
      log: ['error']
    });
    
    await prisma.$connect();
    console.log('✅ Table Info API: Database connected!');

    // Get table structure for users table
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log('📊 Table Info API: Users table structure:', tableInfo);

    // Also check if table exists and get sample data
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `;

    // Get count of users
    const userCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users;
    `;

    // Disconnect
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.log('⚠️ Table Info API: Disconnect error (ignored):', disconnectError.message);
    }

    return NextResponse.json({
      success: true,
      tableExists: tableExists[0]?.exists || false,
      userCount: userCount[0]?.count || 0,
      columns: tableInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Table Info API: Error:', error);
    
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (endError) {
        console.log('⚠️ Table Info API: Error disconnecting:', endError.message);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get table info', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
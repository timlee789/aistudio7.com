import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use standard Prisma configuration with environment variables

export async function GET() {
  let prisma = null;
  
  try {
    console.log('🔍 Table Info API: Creating fresh Prisma client...');
    
    // Create fresh Prisma client
    prisma = new PrismaClient({
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
      SELECT COUNT(*)::int as count FROM users;
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
      userCount: Number(userCount[0]?.count || 0),
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
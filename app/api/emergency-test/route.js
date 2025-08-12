import { NextResponse } from 'next/server';

// Use raw PostgreSQL client that works locally
let Client;
try {
  const pg = require('pg');
  Client = pg.Client;
  console.log('✅ pg module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load pg module:', error);
}

const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function GET() {
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Test: Starting RAW PostgreSQL test...', uniqueId);
  
  let client = null;
  
  try {
    if (!Client) {
      return NextResponse.json({ 
        success: false,
        error: 'PostgreSQL client not available', 
        details: 'pg module failed to load',
        timestamp: new Date().toISOString(),
        uniqueId
      }, { status: 500 });
    }

    console.log('🔗 Emergency Test: Creating PostgreSQL client...');
    client = new Client({
      connectionString: EMERGENCY_DB_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔗 Emergency Test: Connecting...');
    await client.connect();
    console.log('✅ Emergency Test: Connected!');

    // Test 1: User count with raw SQL (correct table name: users)
    console.log('📊 Emergency Test: Counting users with raw SQL...');
    const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userCountResult.rows[0].count);
    console.log('👥 Emergency Test: User count:', userCount);

    // Test 2: Find admin user with raw SQL
    console.log('🔍 Emergency Test: Finding admin user with raw SQL...');
    const adminResult = await client.query('SELECT id, name, email, role FROM users WHERE email = $1', ['admin@aistudio7.com']);
    const adminUser = adminResult.rows[0];
    console.log('🔑 Emergency Test: Admin exists:', !!adminUser);

    const response = NextResponse.json({
      success: true,
      message: 'Emergency RAW PostgreSQL test successful',
      results: {
        userCount,
        adminExists: !!adminUser,
        adminRole: adminUser?.role,
        adminEmail: adminUser?.email,
        adminName: adminUser?.name,
        method: 'RAW_POSTGRESQL_CLIENT',
        databaseUrl: EMERGENCY_DB_URL.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
        uniqueId
      }
    });

    // Always disconnect PostgreSQL client
    try {
      console.log('🔌 Emergency Test: Disconnecting PostgreSQL client...');
      await client.end();
      console.log('✅ Emergency Test: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Emergency Test: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Test Error:', error);
    console.error('💥 Error stack:', error.stack);
    
    // Ensure client is disconnected even on error
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.log('⚠️ Emergency Test: Error disconnecting client:', endError.message);
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Emergency RAW PostgreSQL test failed', 
      details: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
      uniqueId
    }, { status: 500 });
  }
}
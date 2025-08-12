import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    // 직접 SQL 쿼리로 사용자 수 확인
    const result = await client.query('SELECT COUNT(*) as count FROM "User"');
    const userCount = parseInt(result.rows[0].count);
    
    await client.end();
    
    return NextResponse.json({
      status: 'OK',
      message: 'Direct PostgreSQL connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Direct DB test error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Direct database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
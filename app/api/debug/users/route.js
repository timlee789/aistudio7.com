import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    // 사용자 목록 조회 (비밀번호 제외)
    const result = await client.query(`
      SELECT id, name, email, role, company, phone, "createdAt", "updatedAt"
      FROM users 
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    await client.end();
    
    return NextResponse.json({
      status: 'OK',
      users: result.rows,
      count: result.rows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug users error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Failed to fetch users',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
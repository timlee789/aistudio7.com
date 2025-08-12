import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    // 먼저 테이블 목록 확인
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // 사용자 테이블 찾기 (대소문자 구분 없이)
    const tables = tablesResult.rows.map(row => row.table_name);
    const userTable = tables.find(name => name.toLowerCase().includes('user'));
    
    let userCount = 0;
    if (userTable) {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${userTable}"`);
      userCount = parseInt(result.rows[0].count);
    }
    
    await client.end();
    
    return NextResponse.json({
      status: 'OK',
      message: 'Direct PostgreSQL connection successful',
      tables,
      userTable,
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
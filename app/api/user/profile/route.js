import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function GET(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 쿠키에서 토큰 읽기
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    await client.connect();

    // 사용자 정보 조회 (직접 SQL)
    const userResult = await client.query(
      'SELECT id, name, email, role, company, phone FROM users WHERE id = $1',
      [userId]
    );

    await client.end();

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
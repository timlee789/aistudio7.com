import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const { email, password } = await request.json();

    // 간단한 유효성 검사
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    await client.connect();

    // 사용자 찾기 (직접 SQL)
    const userResult = await client.query(
      'SELECT id, name, email, password, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      await client.end();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await client.end();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 응답 생성
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // 쿠키 설정
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
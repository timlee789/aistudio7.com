import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';
import { createId } from '@paralleldrive/cuid2';

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const { name, email, password, company, phone } = await request.json();

    // 유효성 검사
    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'Name, email, password, and phone are required' }, { status: 400 });
    }

    await client.connect();

    // 이메일 중복 확인
    const existingResult = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingResult.rows.length > 0) {
      await client.end();
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const userId = createId();
    const insertResult = await client.query(`
      INSERT INTO users (id, name, email, password, company, phone, role, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
      RETURNING id, name, email, role
    `, [userId, name, email.toLowerCase(), hashedPassword, company || '', phone, 'CLIENT']);

    await client.end();

    const newUser = insertResult.rows[0];

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ 
        error: 'Email and newPassword are required' 
      }, { status: 400 });
    }

    await client.connect();

    // 관리자 계정인지 확인
    const userResult = await client.query(
      'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const user = userResult.rows[0];
    
    if (user.role !== 'ADMIN') {
      await client.end();
      return NextResponse.json({ 
        error: 'Only admin accounts can be reset with this API' 
      }, { status: 403 });
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    const updateResult = await client.query(
      'UPDATE users SET password = $1, "updatedAt" = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    await client.end();

    return NextResponse.json({
      message: 'Admin password updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin password reset error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({ 
      error: 'Password reset failed' 
    }, { status: 500 });
  }
}
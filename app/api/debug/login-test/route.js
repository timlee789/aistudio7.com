import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function GET(request) {
  // URL 파라미터에서 이메일과 비밀번호 가져오기
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const password = searchParams.get('password');

  if (!email || !password) {
    return NextResponse.json({
      status: 'ERROR',
      message: 'Email and password required as query parameters',
      usage: 'Add ?email=your@email.com&password=yourpassword to the URL',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  return await debugLogin(email, password);
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    return await debugLogin(email, password);
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      message: 'Invalid JSON in request body',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

async function debugLogin(email, password) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 로그인 시도 정보
    const debugInfo = {
      receivedEmail: email,
      receivedPassword: password ? '***provided***' : 'NOT_PROVIDED',
      emailLength: email ? email.length : 0,
      passwordLength: password ? password.length : 0
    };

    await client.connect();

    // 모든 사용자 이메일 조회 (디버깅용)
    const allUsersResult = await client.query('SELECT email, role FROM users ORDER BY email');
    const allEmails = allUsersResult.rows.map(row => row.email);

    // 정확한 이메일 매치 찾기
    const userResult = await client.query(
      'SELECT id, name, email, password, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    // 비밀번호 해시 비교 (사용자가 존재하는 경우)
    let passwordCheck = null;
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      passwordCheck = {
        userExists: true,
        storedPasswordHash: user.password.substring(0, 20) + '...',
        passwordMatchResult: await bcrypt.compare(password, user.password)
      };
    }

    await client.end();

    return NextResponse.json({
      status: 'DEBUG',
      debugInfo,
      allEmailsInDB: allEmails,
      userFound: userResult.rows.length > 0,
      foundUser: userResult.rows.length > 0 ? {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role
      } : null,
      passwordCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug login test error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Debug login test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
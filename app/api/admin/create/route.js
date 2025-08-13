import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Client } from 'pg';

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const { adminKey } = await request.json();

    // 보안 키 확인 - 프로덕션에서는 환경변수 사용
    const validAdminKey = process.env.ADMIN_SETUP_KEY || 'create-admin-2024';
    if (adminKey !== validAdminKey) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
    }

    await client.connect();

    // 관리자 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['admin@aistudio7.com']
    );

    let admin;

    if (existingAdmin.rows.length > 0) {
      // Update existing admin
      const updateResult = await client.query(
        'UPDATE users SET password = $1, role = $2, "updatedAt" = NOW() WHERE email = $3 RETURNING id, email, role',
        [hashedPassword, 'ADMIN', 'admin@aistudio7.com']
      );
      admin = updateResult.rows[0];
    } else {
      // Create new admin
      const insertResult = await client.query(
        `INSERT INTO users (name, email, password, company, phone, role, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
         RETURNING id, email, role`,
        ['Administrator', 'admin@aistudio7.com', hashedPassword, 'AiStudio7.com', '010-0000-0000', 'ADMIN']
      );
      admin = insertResult.rows[0];
    }

    await client.end();

    return NextResponse.json({
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
}
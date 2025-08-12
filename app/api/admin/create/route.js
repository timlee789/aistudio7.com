import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  const { adminKey } = await request.json();

  // 간단한 보안 키 확인
  if (adminKey !== 'create-admin-2024') {
    return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 });
  }

  // 관리자 비밀번호 해싱
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 관리자 계정 생성 (이미 있으면 업데이트)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aistudio7.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      name: 'Administrator',
      email: 'admin@aistudio7.com',
      password: hashedPassword,
      company: 'AiStudio7.com',
      phone: '010-0000-0000',
      role: 'ADMIN'
    }
  });

  return NextResponse.json({
    message: 'Admin created successfully',
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role
    }
  });
}
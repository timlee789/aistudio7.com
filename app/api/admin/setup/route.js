import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, adminKey } = await request.json();
    
    // Simple admin setup key for security
    if (adminKey !== 'nava-admin-setup-2024') {
      return NextResponse.json(
        { error: 'Invalid admin setup key' },
        { status: 403 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Try to create admin user with upsert to avoid conflicts
    const admin = await prisma.user.upsert({
      where: {
        email: email.toLowerCase()
      },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        updatedAt: new Date()
      },
      create: {
        name: 'Administrator',
        email: email.toLowerCase(),
        password: hashedPassword,
        company: 'AiStudio7.com',
        phone: '010-0000-0000',
        role: 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Admin account created/updated successfully',
      admin: admin
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to setup admin account', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
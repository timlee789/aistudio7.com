import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'OK',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User count error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      message: 'Failed to count users',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
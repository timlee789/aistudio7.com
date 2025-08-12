import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';

function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', hasPaidService: false },
        { status: 401 }
      );
    }

    // Check if user has any completed payments
    const completedPayment = await prisma.payment.findFirst({
      where: {
        userId: user.userId,
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({
      hasPaidService: !!completedPayment,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Server error occurred', hasPaidService: false },
      { status: 500 }
    );
  }
}
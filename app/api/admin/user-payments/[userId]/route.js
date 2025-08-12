import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';

// Extract user information from token
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

export async function GET(request, { params }) {
  console.log('👤 User Payments API: GET request received for user:', params.userId);
  
  try {
    // Check authentication and admin role
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    if (!userRecord || userRecord.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified, fetching user payments...');

    // Get user details with payments
    const userWithPayments = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!userWithPayments) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userSafeData } = userWithPayments;

    console.log(`📊 Found user with ${userWithPayments.payments.length} payments`);

    return NextResponse.json({
      user: userSafeData
    });

  } catch (error) {
    console.error('💥 User Payments API error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
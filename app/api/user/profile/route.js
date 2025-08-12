import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Use standard Prisma configuration with environment variables
const JWT_SECRET = process.env.JWT_SECRET || "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

// Extract user information from token
function getUserFromToken(request) {
  try {
    // Debug: Check all cookies
    const allCookies = request.cookies.getAll();
    console.log('🍪 Profile API: All cookies received:', allCookies);
    
    const token = request.cookies.get('token')?.value;
    console.log('🍪 Profile API: Token from cookie:', token ? 'present' : 'missing');
    if (token) {
      console.log('🍪 Profile API: Token length:', token.length);
      console.log('🍪 Profile API: Token start:', token.substring(0, 20) + '...');
    }
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Profile API: Token decoded successfully for user:', decoded.userId);
    return decoded;
  } catch (error) {
    console.error('❌ Profile API: Token verification error:', error.message);
    return null;
  }
}

// Get user profile (GET)
export async function GET(request) {
  console.log('Profile API: GET request received');
  let prisma = null;
  
  try {
    const user = getUserFromToken(request);
    if (!user) {
      console.log('Profile API: No user found from token, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Profile API: User found from token, fetching profile for:', user.userId);

    // Create fresh Prisma client
    prisma = new PrismaClient({
      log: ['error']
    });
    
    await prisma.$connect();

    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        snsSettings: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Disconnect before returning
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.log('⚠️ Profile API: Disconnect error (ignored):', disconnectError.message);
    }

    return NextResponse.json({ user: userProfile }, { status: 200 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // Ensure disconnect on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.log('⚠️ Profile API: Error disconnecting:', disconnectError.message);
      }
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update SNS settings (PUT)
export async function PUT(request) {
  let prisma = null;
  
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { snsSettings } = await request.json();

    // Create fresh Prisma client
    prisma = new PrismaClient({
      log: ['error']
    });
    
    await prisma.$connect();

    // Upsert SNS settings (create if not exists, update if exists)
    const updatedSnsSettings = await prisma.snsSettings.upsert({
      where: {
        userId: user.userId
      },
      update: {
        platforms: snsSettings.platforms || [],
        settings: snsSettings.settings || {}
      },
      create: {
        userId: user.userId,
        platforms: snsSettings.platforms || [],
        settings: snsSettings.settings || {}
      }
    });

    // Fetch updated user information
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        snsSettings: true
      }
    });

    // Disconnect before returning
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.log('⚠️ Profile API: Disconnect error (ignored):', disconnectError.message);
    }

    return NextResponse.json(
      { message: 'SNS settings updated successfully', user: updatedUser },
      { status: 200 }
    );

  } catch (error) {
    console.error('SNS settings update error:', error);
    
    // Ensure disconnect on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        console.log('⚠️ Profile API: Error disconnecting:', disconnectError.message);
      }
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
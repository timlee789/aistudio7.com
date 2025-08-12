import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Use standard Prisma configuration with environment variables
const JWT_SECRET = process.env.JWT_SECRET || "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

// Extract user information from token
function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

// Get user profile (GET)
export async function GET(request) {
  let prisma = null;
  
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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
      // Ignore disconnect errors
    }

    return NextResponse.json({ user: userProfile }, { status: 200 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    
    // Ensure disconnect on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (disconnectError) {
        // Ignore disconnect errors
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
      // Ignore disconnect errors
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
        // Ignore disconnect errors
      }
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
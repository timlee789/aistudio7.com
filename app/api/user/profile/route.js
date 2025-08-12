import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    return NextResponse.json({ user: userProfile });

  } catch (error) {
    console.error('Profile API GET error:', error);
    
    return NextResponse.json(
      { 
        error: 'Server error occurred', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Update SNS settings (POST)
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { snsSettings } = await request.json();

    // Upsert SNS settings (create if not exists, update if exists)
    const updatedSnsSettings = await prisma.snsSettings.upsert({
      where: {
        userId: user.userId
      },
      update: {
        platforms: JSON.stringify(snsSettings.platforms || []),
        settings: JSON.stringify(snsSettings.settings || {}),
        updatedAt: new Date()
      },
      create: {
        userId: user.userId,
        platforms: JSON.stringify(snsSettings.platforms || []),
        settings: JSON.stringify(snsSettings.settings || {})
      }
    });

    return NextResponse.json({ 
      message: 'SNS settings updated successfully',
      snsSettings: {
        id: updatedSnsSettings.id,
        platforms: JSON.parse(updatedSnsSettings.platforms),
        settings: JSON.parse(updatedSnsSettings.settings)
      }
    });

  } catch (error) {
    console.error('Profile API POST error:', error);
    
    return NextResponse.json(
      { 
        error: 'Server error occurred', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
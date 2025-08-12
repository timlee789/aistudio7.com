import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Use standard Prisma configuration with environment variables
const JWT_SECRET = process.env.JWT_SECRET || "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Google token is required' },
        { status: 400 }
      );
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        snsSettings: true
      }
    });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId: googleId,
            updatedAt: new Date()
          },
          include: {
            snsSettings: true
          }
        });
      }
    } else {
      // Create new user with Google OAuth
      const hashedPassword = await bcrypt.hash(googleId + Date.now(), 10);
      
      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email: email.toLowerCase(),
          password: hashedPassword,
          company: '',
          phone: '',
          role: 'CLIENT',
          googleId: googleId
        },
        include: {
          snsSettings: true
        }
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response
    const response = NextResponse.json({
      message: 'Google authentication successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
        snsSettings: user.snsSettings
      }
    });

    // Set JWT token as HTTP-only cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Google OAuth API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Server error occurred', 
        details: error.message,
        errorName: error.name,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Hardcoded DATABASE_URL to bypass Vercel env var issues
const WORKING_DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const JWT_SECRET = process.env.JWT_SECRET || "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request) {
  let prisma = null;
  
  try {
    console.log('🔐 Google OAuth API: Starting authentication process...');
    
    const { token } = await request.json();

    if (!token) {
      console.log('❌ Google OAuth API: Missing Google token');
      return NextResponse.json(
        { error: 'Google token is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Google OAuth API: Verifying Google token...');
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      console.log('❌ Google OAuth API: Email not provided by Google');
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    console.log('📨 Google OAuth API: Google user verified:', email);

    // Create fresh Prisma client
    console.log('🔍 Google OAuth API: Creating fresh Prisma client...');
    prisma = new PrismaClient({
      datasources: {
        db: { url: WORKING_DATABASE_URL }
      },
      log: ['error']
    });
    
    await prisma.$connect();
    console.log('✅ Google OAuth API: Database connected!');

    console.log('🔍 Google OAuth API: Checking for existing user...');
    
    // Check if user already exists with raw query
    const existingUsers = await prisma.$queryRaw`
      SELECT id, name, email, password, company, phone, role, "googleId"
      FROM users 
      WHERE email = ${email.toLowerCase()} 
      LIMIT 1
    `;

    let user;
    
    if (existingUsers.length > 0) {
      user = existingUsers[0];
      console.log('👤 Google OAuth API: User exists:', user.email);
      
      // User exists, update Google ID if not set
      if (!user.googleId) {
        console.log('🔄 Google OAuth API: Updating Google ID...');
        const updatedUsers = await prisma.$queryRaw`
          UPDATE users 
          SET "googleId" = ${googleId}, "updatedAt" = NOW()
          WHERE id = ${user.id}
          RETURNING id, name, email, company, phone, role, "googleId"
        `;
        user = updatedUsers[0];
      }
    } else {
      console.log('👤 Google OAuth API: Creating new user...');
      
      // Generate unique ID - use crypto UUID for better compatibility
      const userId = randomUUID().replace(/-/g, '');
      console.log('🆔 Google OAuth API: Generated user ID:', userId);
      
      // Create new user
      const hashedPassword = await bcrypt.hash(`google_${googleId}_${Date.now()}`, 10);
      
      const newUsers = await prisma.$queryRaw`
        INSERT INTO users (id, name, email, password, "googleId", phone, company, role, "createdAt", "updatedAt")
        VALUES (${userId}, ${name}, ${email.toLowerCase()}, ${hashedPassword}, ${googleId}, '', '', 'CLIENT', NOW(), NOW())
        RETURNING id, name, email, company, phone, role, "googleId"
      `;
      
      user = newUsers[0];
      console.log('✅ Google OAuth API: New user created:', user.email);
    }

    console.log('🎫 Google OAuth API: Generating JWT token...');
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Google OAuth API: JWT token generated successfully');

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Set HTTP-only cookie
    response.cookies.set('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Always disconnect Prisma client
    try {
      console.log('🔌 Google OAuth API: Disconnecting Prisma client...');
      await prisma.$disconnect();
      console.log('✅ Google OAuth API: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Google OAuth API: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Google OAuth API: Detailed error occurred:', error);
    console.error('💥 Google OAuth API: Error name:', error.name);
    console.error('💥 Google OAuth API: Error message:', error.message);
    console.error('💥 Google OAuth API: Error stack:', error.stack);
    
    // Ensure Prisma client is disconnected even on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (endError) {
        console.log('⚠️ Google OAuth API: Error disconnecting Prisma:', endError.message);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Google authentication failed', 
        details: error.message,
        errorName: error.name,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
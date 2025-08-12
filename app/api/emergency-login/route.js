import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Emergency login endpoint with completely hardcoded values
const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const EMERGENCY_JWT_SECRET = "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

export async function POST(request) {
  // Create unique instance identifier
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Login: Starting...', uniqueId);
  
  try {
    const { email, password } = await request.json();
    console.log('📧 Emergency Login: Email received:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Create fresh Prisma client each time with unique config
    console.log('🔍 Emergency Login: Creating fresh Prisma client...');
    const freshLoginPrisma = new PrismaClient({
      datasources: {
        db: { url: EMERGENCY_DB_URL }
      },
      log: ['error']
    });
    
    await freshLoginPrisma.$connect();
    console.log('✅ Emergency Login: Database connected!');

    // Find user
    const user = await freshLoginPrisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    console.log('👤 Emergency Login: User found:', !!user);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password);
    console.log('🔐 Emergency Login: Password valid:', isValid);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      EMERGENCY_JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎫 Emergency Login: JWT generated successfully');

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      message: 'Emergency login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    // Always disconnect fresh connection immediately before returning
    try {
      console.log('🔌 Emergency Login: Disconnecting...');
      await freshLoginPrisma.$disconnect();
      console.log('✅ Emergency Login: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Emergency Login: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Login Error:', error);
    return NextResponse.json({ 
      error: 'Emergency login failed', 
      details: error.message,
      uniqueId
    }, { status: 500 });
  }
}
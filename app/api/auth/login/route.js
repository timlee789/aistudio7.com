import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export async function POST(request) {
  let prisma = null;
  
  try {
    console.log('🔐 Login API: Starting login process...');
    
    const { email, password } = await request.json();
    console.log('📨 Login API: Email received:', email);

    // Validation check
    if (!email || !password) {
      console.log('❌ Login API: Missing email or password');
      return NextResponse.json(
        { error: 'Please enter email and password' },
        { status: 400 }
      );
    }

    console.log('🔍 Login API: Creating fresh Prisma client...');
    
    // Hardcode DATABASE_URL to bypass Vercel environment variable issues
    const WORKING_DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
    
    // Create fresh Prisma client for each request to avoid prepared statement issues
    prisma = new PrismaClient({
      datasources: {
        db: { url: WORKING_DATABASE_URL }
      },
      log: ['error']
    });
    
    await prisma.$connect();
    console.log('✅ Login API: Database connected!');
    
    console.log('🔍 Login API: Searching for user in database...');
    
    // Find user including SNS settings with raw query to avoid prepared statement caching
    const users = await prisma.$queryRaw`
      SELECT 
        u.id, u.name, u.email, u.password, u.company, u.phone, u.role,
        s.id as sns_id, s.platforms, s.settings as sns_settings
      FROM users u
      LEFT JOIN sns_settings s ON u.id = s."userId"
      WHERE u.email = ${email.toLowerCase()}
      LIMIT 1
    `;
    
    const userData = users[0];
    const user = userData ? {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      company: userData.company,
      phone: userData.phone,
      role: userData.role,
      snsSettings: userData.sns_id ? {
        id: userData.sns_id,
        platforms: userData.platforms,
        settings: userData.sns_settings
      } : null
    } : null;

    console.log('👤 Login API: User found:', user ? `${user.email} (${user.role})` : 'No user found');

    if (!user) {
      console.log('❌ Login API: User not found for email:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('🔒 Login API: Verifying password...');
    
    // Password verification
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('🔐 Login API: Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Login API: Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('🎫 Login API: Generating JWT token...');
    console.log('🔑 Login API: JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login API: JWT token generated successfully');

    // Exclude password from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      role: user.role,
      snsSettings: user.snsSettings
    };

    const response = NextResponse.json(
      { message: 'Login successful', user: userResponse },
      { status: 200 }
    );

    // Set token as HTTP-only cookie
    console.log('Login API: Setting cookie with token for user:', user.id);
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    console.log('Login API: Cookie settings:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      tokenLength: token.length
    });

    // Always disconnect Prisma client
    try {
      console.log('🔌 Login API: Disconnecting Prisma client...');
      await prisma.$disconnect();
      console.log('✅ Login API: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Login API: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Login API: Detailed error occurred:', error);
    console.error('💥 Login API: Error name:', error.name);
    console.error('💥 Login API: Error message:', error.message);
    console.error('💥 Login API: Error stack:', error.stack);
    
    // Ensure Prisma client is disconnected even on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (endError) {
        console.log('⚠️ Login API: Error disconnecting Prisma:', endError.message);
      }
    }
    
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
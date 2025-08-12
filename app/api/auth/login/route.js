import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';

export async function POST(request) {
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

    console.log('🔍 Login API: Searching for user in database...');
    
    // Find user (including SNS settings)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        snsSettings: true
      }
    });

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

    return response;

  } catch (error) {
    console.error('💥 Login API: Detailed error occurred:', error);
    console.error('💥 Login API: Error name:', error.name);
    console.error('💥 Login API: Error message:', error.message);
    console.error('💥 Login API: Error stack:', error.stack);
    
    // Additional debugging information
    console.error('💥 Login API: Environment info:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_DATABASE_URL: !!process.env.DATABASE_URL,
      HAS_JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0
    });
    
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
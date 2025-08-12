import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validation check
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter email and password' },
        { status: 400 }
      );
    }
    
    // Find user including SNS settings
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase() 
      },
      include: {
        snsSettings: true
      }
    });


    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Password verification
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    
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
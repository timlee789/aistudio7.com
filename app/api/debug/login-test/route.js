import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';

export async function POST(request) {
  try {
    console.log('🧪 Login Test API: Starting debug test...');
    
    const { email, password } = await request.json();
    console.log('📨 Login Test API: Testing login for:', email);

    // Step 1: Test environment variables
    console.log('1️⃣ Environment check:');
    console.log('   - NODE_ENV:', process.env.NODE_ENV);
    console.log('   - DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('   - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('   - JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

    // Step 2: Test database connection
    console.log('2️⃣ Database connection test:');
    const userCount = await prisma.user.count();
    console.log('   - Total users in database:', userCount);

    // Step 3: Find specific user
    console.log('3️⃣ User lookup test:');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    console.log('   - User found:', user ? `${user.email} (${user.role})` : 'No user found');
    console.log('   - User ID:', user?.id);
    console.log('   - Password hash exists:', !!user?.password);
    console.log('   - Password hash length:', user?.password?.length);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        step: 'user_lookup'
      }, { status: 404 });
    }

    // Step 4: Test password verification
    console.log('4️⃣ Password verification test:');
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('   - Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid password',
        step: 'password_verification'
      }, { status: 401 });
    }

    // Step 5: Test JWT generation
    console.log('5️⃣ JWT generation test:');
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('   - JWT token generated successfully');
    console.log('   - Token length:', token.length);
    console.log('   - Token preview:', token.substring(0, 50) + '...');

    // Step 6: Test JWT verification
    console.log('6️⃣ JWT verification test:');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('   - JWT verification successful');
    console.log('   - Decoded user ID:', decoded.userId);

    return NextResponse.json({
      success: true,
      message: 'All login tests passed successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tests: {
        environment: 'passed',
        database: 'passed',
        user_lookup: 'passed',
        password_verification: 'passed',
        jwt_generation: 'passed',
        jwt_verification: 'passed'
      }
    });

  } catch (error) {
    console.error('💥 Login Test API: Error occurred:', error);
    console.error('💥 Login Test API: Error name:', error.name);
    console.error('💥 Login Test API: Error message:', error.message);
    console.error('💥 Login Test API: Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: 'Server error during login test',
      details: error.message,
      name: error.name,
      stack: error.stack
    }, { status: 500 });
  }
}
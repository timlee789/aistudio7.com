import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Emergency login endpoint with completely hardcoded values
const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const EMERGENCY_JWT_SECRET = "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

// Global prisma instance
let globalLoginPrisma;

export async function POST(request) {
  
  try {
    console.log('🚨 Emergency Login: Starting...');
    
    const { email, password } = await request.json();
    console.log('📧 Emergency Login: Email received:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Use global prisma instance or create new one
    if (!globalLoginPrisma) {
      console.log('🔍 Emergency Login: Creating new Prisma client...');
      globalLoginPrisma = new PrismaClient({
        datasources: {
          db: { url: EMERGENCY_DB_URL }
        }
      });
      await globalLoginPrisma.$connect();
      console.log('✅ Emergency Login: Database connected!');
    } else {
      console.log('✅ Emergency Login: Using existing Prisma client');
    }

    // Find user
    const user = await globalLoginPrisma.user.findUnique({
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

    return response;

  } catch (error) {
    console.error('💥 Emergency Login Error:', error);
    return NextResponse.json({ 
      error: 'Emergency login failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    // Keep connection alive for better performance
    console.log('🔄 Emergency Login: Keeping connection alive');
  }
}
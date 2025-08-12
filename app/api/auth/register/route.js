import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Hardcoded DATABASE_URL to bypass Vercel env var issues
const WORKING_DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function POST(request) {
  let prisma = null;
  
  try {
    console.log('🔐 Register API: Starting registration process...');
    
    const { name, email, password, company, phone } = await request.json();
    console.log('📨 Register API: Registration data received for:', email);

    // Validation check
    if (!name || !email || !password || !phone) {
      console.log('❌ Register API: Missing required fields');
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    console.log('🔍 Register API: Creating fresh Prisma client...');
    
    // Create fresh Prisma client for each request to avoid prepared statement issues
    prisma = new PrismaClient({
      datasources: {
        db: { url: WORKING_DATABASE_URL }
      },
      log: ['error']
    });
    
    await prisma.$connect();
    console.log('✅ Register API: Database connected!');

    console.log('🔍 Register API: Checking for existing user...');
    
    // Check for duplicate email with raw query to avoid prepared statement caching
    const existingUsers = await prisma.$queryRaw`
      SELECT id, email FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      console.log('❌ Register API: Email already exists:', email);
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    console.log('🔒 Register API: Hashing password...');
    
    // Password hashing
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    console.log('👤 Register API: Creating new user...');
    
    // Generate unique ID - use crypto UUID for better compatibility
    const userId = randomUUID().replace(/-/g, '');
    console.log('🆔 Register API: Generated user ID:', userId);
    
    // Create new user with raw query
    const newUserResult = await prisma.$queryRaw`
      INSERT INTO users (id, name, email, password, company, phone, role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email.toLowerCase()}, ${hashedPassword}, ${company || ''}, ${phone}, 'CLIENT', NOW(), NOW())
      RETURNING id, name, email, company, phone, role, "createdAt"
    `;
    
    const newUser = newUserResult[0];
    console.log('✅ Register API: User created successfully:', newUser.email);

    // Exclude password from response
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      phone: newUser.phone,
      role: newUser.role
    };

    // Always disconnect Prisma client
    try {
      console.log('🔌 Register API: Disconnecting Prisma client...');
      await prisma.$disconnect();
      console.log('✅ Register API: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Register API: Disconnect error (ignored):', disconnectError.message);
    }

    return NextResponse.json(
      { message: 'Registration completed successfully', user: userResponse },
      { status: 201 }
    );

  } catch (error) {
    console.error('💥 Register API: Detailed error occurred:', error);
    console.error('💥 Register API: Error name:', error.name);
    console.error('💥 Register API: Error message:', error.message);
    console.error('💥 Register API: Error stack:', error.stack);
    
    // Ensure Prisma client is disconnected even on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (endError) {
        console.log('⚠️ Register API: Error disconnecting Prisma:', endError.message);
      }
    }
    
    if (error.code === 'P2002' || (error.message && error.message.includes('duplicate key'))) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
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
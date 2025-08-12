import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

// Use standard Prisma configuration with environment variables
const JWT_SECRET = process.env.JWT_SECRET || "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

export async function POST(request) {
  let prisma = null;
  
  try {
    const { name, email, password, company, phone } = await request.json();

    // Validation check
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Create fresh Prisma client for each request to avoid prepared statement issues
    prisma = new PrismaClient({
      log: ['error']
    });
    
    await prisma.$connect();
    
    // Check for duplicate email with raw query to avoid prepared statement caching
    const existingUsers = await prisma.$queryRaw`
      SELECT id, email FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Password hashing
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    // Generate unique ID - use crypto UUID for better compatibility
    const userId = randomUUID().replace(/-/g, '');
    
    // Create new user with raw query
    const newUserResult = await prisma.$queryRaw`
      INSERT INTO users (id, name, email, password, company, phone, role, "createdAt", "updatedAt")
      VALUES (${userId}, ${name}, ${email.toLowerCase()}, ${hashedPassword}, ${company || ''}, ${phone}, 'CLIENT', NOW(), NOW())
      RETURNING id, name, email, company, phone, role, "createdAt"
    `;
    
    const newUser = newUserResult[0];

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
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Register API: Disconnect error:', disconnectError.message);
    }

    return NextResponse.json(
      { message: 'Registration completed successfully', user: userResponse },
      { status: 201 }
    );

  } catch (error) {
    console.error('Register API error:', error);
    
    // Ensure Prisma client is disconnected even on error
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (endError) {
        console.error('Register API: Error disconnecting Prisma:', endError.message);
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
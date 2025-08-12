import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import prisma from '@/lib/prisma-new';

export async function POST(request) {
  try {
    const { name, email, password, company, phone } = await request.json();

    // Validation check
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Password hashing
    const saltRounds = 12;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        company,
        phone,
        role: 'CLIENT'
      }
    });

    // Exclude password from response
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      company: newUser.company,
      phone: newUser.phone,
      role: newUser.role
    };

    return NextResponse.json(
      { message: 'Registration completed successfully', user: userResponse },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

// Emergency login endpoint with completely hardcoded values
const EMERGENCY_DB_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
const EMERGENCY_JWT_SECRET = "mRpWAlXU+fo7AqHQEaJG1NRPktETWoK7kKMka04orH8hOVrChNNhE/+jE3DoqVHsu9UzgOXATmWp6oOycKMJ6g==";

export async function POST(request) {
  const uniqueId = Date.now() + Math.random().toString(36);
  console.log('🚨 Emergency Login: Starting RAW SQL login...', uniqueId);
  
  let client = null;
  
  try {
    const { email, password } = await request.json();
    console.log('📧 Emergency Login: Email received:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Use raw PostgreSQL client to bypass Prisma issues
    console.log('🔍 Emergency Login: Creating PostgreSQL client...');
    client = new Client({
      connectionString: EMERGENCY_DB_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Emergency Login: Database connected!');

    // Find user with raw SQL
    console.log('🔍 Emergency Login: Finding user with raw SQL...');
    const userResult = await client.query(
      'SELECT id, email, name, password, role FROM "User" WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = userResult.rows[0];

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

    // Always disconnect PostgreSQL client before returning
    try {
      console.log('🔌 Emergency Login: Disconnecting PostgreSQL client...');
      await client.end();
      console.log('✅ Emergency Login: Disconnected cleanly');
    } catch (disconnectError) {
      console.log('⚠️ Emergency Login: Disconnect error (ignored):', disconnectError.message);
    }

    return response;

  } catch (error) {
    console.error('💥 Emergency Login Error:', error);
    
    // Ensure client is disconnected even on error
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.log('⚠️ Emergency Login: Error disconnecting client:', endError.message);
      }
    }
    
    return NextResponse.json({ 
      error: 'Emergency RAW SQL login failed', 
      details: error.message,
      uniqueId
    }, { status: 500 });
  }
}
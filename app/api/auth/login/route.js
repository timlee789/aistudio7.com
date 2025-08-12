import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Use raw PostgreSQL client to avoid Prisma prepared statement issues
let Client;
try {
  const pg = require('pg');
  Client = pg.Client;
  console.log('✅ pg module loaded successfully for login');
} catch (error) {
  console.error('❌ Failed to load pg module for login:', error);
}

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

export async function POST(request) {
  let client = null;
  
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

    // Check if Client is available
    if (!Client) {
      console.error('❌ pg Client not available for login');
      return NextResponse.json({ 
        error: 'Database client not available', 
        details: 'pg module failed to load'
      }, { status: 500 });
    }

    console.log('🔍 Login API: Connecting to database...');
    client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('✅ Login API: Database connected!');
    
    console.log('🔍 Login API: Searching for user in database...');
    
    // Find user with raw SQL including SNS settings
    const userResult = await client.query(`
      SELECT 
        u.id, u.name, u.email, u.password, u.company, u.phone, u.role,
        s.id as sns_id, s.platforms, s.settings as sns_settings
      FROM users u
      LEFT JOIN sns_settings s ON u.id = s."userId"
      WHERE u.email = $1
    `, [email.toLowerCase()]);
    
    const userData = userResult.rows[0];
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

    // Always disconnect PostgreSQL client
    try {
      console.log('🔌 Login API: Disconnecting PostgreSQL client...');
      await client.end();
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
    
    // Ensure client is disconnected even on error
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.log('⚠️ Login API: Error disconnecting client:', endError.message);
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
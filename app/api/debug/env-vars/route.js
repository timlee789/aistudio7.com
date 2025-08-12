import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Env Vars API: Checking environment variables...');
    
    // Check key environment variables (mask sensitive values)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET (length: ' + process.env.GOOGLE_CLIENT_ID.length + ')' : 'NOT SET',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET (length: ' + process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.length + ')' : 'NOT SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET (length: ' + process.env.SUPABASE_URL.length + ')' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT SET',
      // Check if DATABASE_URL starts correctly
      DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT SET',
      ALL_ENV_KEYS_COUNT: Object.keys(process.env).length
    };

    console.log('📊 Env Vars API: Environment check:', envCheck);

    return NextResponse.json({
      success: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Env Vars API: Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check environment variables', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + '...' + process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 30) : 
        'Not found',
      
      // Check for common patterns
      CONTAINS_LOCALHOST: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('localhost') : false,
      CONTAINS_SUPABASE: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('supabase') : false,
      CONTAINS_ENCODED_CHARS: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('%21') : false,
      
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      
      SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      environment: envInfo,
      expectedDatabaseUrl: {
        format: 'postgresql://postgres:PASSWORD@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres',
        expectedLength: 90,
        note: 'Password should be URL encoded (! -> %21, @ -> %40, # -> %23)'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
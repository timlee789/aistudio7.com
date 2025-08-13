import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envStatus = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(envStatus, { status: 200 });
  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}
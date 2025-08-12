import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL ? `Set (${process.env.DATABASE_URL.length} chars)` : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? `Set (${process.env.JWT_SECRET.length} chars)` : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET'
    },
    timestamp: new Date().toISOString()
  });
}
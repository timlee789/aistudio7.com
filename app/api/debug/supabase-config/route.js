import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  return NextResponse.json({
    status: 'DEBUG',
    environment: process.env.NODE_ENV,
    config: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)` : 'NOT_SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : 'NOT_SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL : 'NOT_SET',
      JWT_SECRET: process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT_SET'
    },
    clients: {
      supabase: supabase ? 'INITIALIZED' : 'NOT_INITIALIZED',
      supabaseAdmin: supabaseAdmin ? 'INITIALIZED' : 'NOT_INITIALIZED'
    },
    timestamp: new Date().toISOString()
  });
}
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Show exactly what DATABASE_URL is being used
    const envUrl = process.env.DATABASE_URL;
    const hardcodedUrl = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";
    
    // Check if our hardcoded URL is being used
    const prismaUrl = hardcodedUrl; // This should be the same as in prisma.js
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        ENV_DATABASE_URL: envUrl ? `${envUrl.substring(0, 30)}...${envUrl.substring(envUrl.length - 30)}` : 'Not found',
        ENV_URL_LENGTH: envUrl ? envUrl.length : 0,
        HARDCODED_URL: `${hardcodedUrl.substring(0, 30)}...${hardcodedUrl.substring(hardcodedUrl.length - 30)}`,
        HARDCODED_LENGTH: hardcodedUrl.length,
        USING_URL: `${prismaUrl.substring(0, 30)}...${prismaUrl.substring(prismaUrl.length - 30)}`,
        USING_LENGTH: prismaUrl.length,
        BUILD_TIME: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
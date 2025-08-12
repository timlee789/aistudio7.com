import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚨 Simple Test: Starting basic test...');
    
    return NextResponse.json({
      success: true,
      message: 'Simple test successful',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });

  } catch (error) {
    console.error('💥 Simple Test Error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Simple test failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Set max body size headers for Vercel
    response.headers.set('x-middleware-request-body-size', '104857600'); // 100MB in bytes
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json(
    { error: 'This API is temporarily under maintenance' },
    { status: 503 }
  );
}
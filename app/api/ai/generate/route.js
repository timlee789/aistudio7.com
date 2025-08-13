import { NextResponse } from 'next/server';

export async function POST(request) {
  return NextResponse.json(
    { error: 'AI generation is temporarily under maintenance' },
    { status: 503 }
  );
}

export async function GET(request) {
  return NextResponse.json(
    { error: 'AI generation is temporarily under maintenance' },
    { status: 503 }
  );
}
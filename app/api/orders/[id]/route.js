import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  return NextResponse.json(
    { error: 'This API is temporarily under maintenance' },
    { status: 503 }
  );
}

export async function PUT(request, { params }) {
  return NextResponse.json(
    { error: 'This API is temporarily under maintenance' },
    { status: 503 }
  );
}
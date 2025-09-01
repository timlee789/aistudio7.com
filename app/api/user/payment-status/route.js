import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await client.connect();

    // Check if user has any completed payments
    const paymentResult = await client.query(
      'SELECT id FROM payments WHERE "userId" = $1 AND status = $2 LIMIT 1',
      [user.userId, 'COMPLETED']
    );

    await client.end();

    return NextResponse.json({
      hasPaidService: paymentResult.rows.length > 0,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
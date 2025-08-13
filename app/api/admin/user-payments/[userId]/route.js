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

export async function GET(request, { params }) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await client.connect();

    // Verify admin role
    const userResult = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [user.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'ADMIN') {
      await client.end();
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId } = params;

    // Get user details
    const userDetailsResult = await client.query(
      'SELECT id, name, email, company, phone, role, "createdAt" FROM users WHERE id = $1',
      [userId]
    );

    if (userDetailsResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDetailsResult.rows[0];

    // Get all payments for this user
    const paymentsResult = await client.query(
      'SELECT * FROM payments WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    await client.end();

    return NextResponse.json({
      user: {
        ...userData,
        payments: paymentsResult.rows
      }
    });

  } catch (error) {
    console.error('User payments fetch error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
}
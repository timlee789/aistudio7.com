import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { createId } from '@paralleldrive/cuid2';

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

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only allow admin to create test payments
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId } = await request.json();
    const userIdToUpdate = targetUserId || user.userId;

    await client.connect();

    // Create test payment
    const paymentId = createId();
    await client.query(`
      INSERT INTO payments (id, amount, currency, status, "serviceType", "serviceName", "userId", "createdAt", "updatedAt", "paidAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
    `, [
      paymentId,
      99.99,
      'usd',
      'COMPLETED',
      'PLAN',
      'Test Service Plan',
      userIdToUpdate
    ]);

    await client.end();

    return NextResponse.json({ 
      message: 'Test payment created successfully',
      paymentId 
    });

  } catch (error) {
    console.error('Test payment creation error:', error);
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

export async function DELETE(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only allow admin to delete test payments
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId } = await request.json();
    const userIdToUpdate = targetUserId || user.userId;

    await client.connect();

    // Delete test payments
    const result = await client.query(
      'DELETE FROM payments WHERE "userId" = $1 AND "serviceName" = $2',
      [userIdToUpdate, 'Test Service Plan']
    );

    await client.end();

    return NextResponse.json({ 
      message: 'Test payments removed successfully',
      deletedCount: result.rowCount 
    });

  } catch (error) {
    console.error('Test payment deletion error:', error);
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
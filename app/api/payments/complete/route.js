import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const body = await request.json();
    const { sessionId, status } = body;

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await client.connect();

    // Find the payment record
    const paymentResult = await client.query(
      'SELECT * FROM payments WHERE "stripeSessionId" = $1 AND "userId" = $2',
      [sessionId, decoded.userId]
    );

    if (paymentResult.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = paymentResult.rows[0];

    // Update payment status
    const updateResult = await client.query(`
      UPDATE payments 
      SET status = $1, "paidAt" = $2, "updatedAt" = NOW() 
      WHERE id = $3 
      RETURNING *
    `, [
      status,
      status === 'COMPLETED' ? new Date() : null,
      payment.id
    ]);

    await client.end();

    return NextResponse.json({
      success: true,
      payment: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Failed to complete payment' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';

// Extract user information from token
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
    // Check authentication and admin role
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await client.connect();

    // Verify admin role
    const userResult = await client.query(
      'SELECT role FROM users WHERE id = $1',
      [user.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'ADMIN') {
      await client.end();
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all payments with user information
    const paymentsResult = await client.query(`
      SELECT 
        p.*,
        u.id as user_id, u.name, u.email, u.company, u.phone, u."createdAt" as user_created_at
      FROM payments p
      LEFT JOIN users u ON p."userId" = u.id
      ORDER BY p."createdAt" DESC
    `);

    const payments = paymentsResult.rows;

    // Calculate statistics
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      pendingPayments: payments.filter(p => p.status === 'PENDING').length,
      completedPayments: payments.filter(p => p.status === 'COMPLETED').length,
      failedPayments: payments.filter(p => p.status === 'FAILED').length,
    };

    await client.end();

    return NextResponse.json({
      payments: payments,
      stats: stats
    });

  } catch (error) {
    console.error('Admin Payments API error:', error);
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
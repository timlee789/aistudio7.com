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
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page'); // 'client-portal', 'service-request', 'sns-settings'
    
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({
        hasAccess: false,
        reason: 'not_authenticated',
        requiresPayment: true
      });
    }

    await client.connect();

    // Get payment requirement settings for the specific page
    let settingKey;
    switch (page) {
      case 'client-portal':
        settingKey = 'require_payment_client_portal';
        break;
      case 'service-request':
        settingKey = 'require_payment_service_request';
        break;
      case 'sns-settings':
        settingKey = 'require_payment_sns_settings';
        break;
      default:
        settingKey = null;
    }

    let requiresPayment = true; // Default to requiring payment

    if (settingKey) {
      const settingResult = await client.query(
        'SELECT setting_value FROM payment_settings WHERE setting_key = $1',
        [settingKey]
      );
      
      if (settingResult.rows.length > 0) {
        requiresPayment = settingResult.rows[0].setting_value;
      }
    }

    // If payment is not required, grant access
    if (!requiresPayment) {
      await client.end();
      return NextResponse.json({
        hasAccess: true,
        reason: 'payment_not_required',
        requiresPayment: false,
        hasPaidService: false,
        user: {
          id: user.userId,
          name: user.name,
          email: user.email
        }
      });
    }

    // Check if user has any completed payments
    const paymentResult = await client.query(
      'SELECT id FROM payments WHERE "userId" = $1 AND status = $2 LIMIT 1',
      [user.userId, 'COMPLETED']
    );

    const hasPaidService = paymentResult.rows.length > 0;

    await client.end();

    return NextResponse.json({
      hasAccess: hasPaidService,
      reason: hasPaidService ? 'payment_completed' : 'payment_required',
      requiresPayment: true,
      hasPaidService,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Page access check error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({
      hasAccess: false,
      reason: 'server_error',
      requiresPayment: true
    }, { status: 500 });
  }
}
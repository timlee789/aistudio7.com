import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

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

// GET - 현재 payment required 설정 조회
export async function GET(request) {
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

    // Check if payment settings table exists, if not create it
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value BOOLEAN NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get current settings or set defaults
    const settingsResult = await client.query(`
      SELECT setting_key, setting_value FROM payment_settings
      WHERE setting_key IN ('require_payment_client_portal', 'require_payment_service_request', 'require_payment_sns_settings')
    `);

    const settings = {};
    settingsResult.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    // Set defaults if not exists
    const defaults = {
      require_payment_client_portal: true,
      require_payment_service_request: true,
      require_payment_sns_settings: true
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in settings)) {
        await client.query(
          'INSERT INTO payment_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING',
          [key, defaultValue]
        );
        settings[key] = defaultValue;
      }
    }

    await client.end();

    return NextResponse.json({
      settings: {
        clientPortal: settings.require_payment_client_portal ?? true,
        serviceRequest: settings.require_payment_service_request ?? true,
        snsSettings: settings.require_payment_sns_settings ?? true
      }
    });

  } catch (error) {
    console.error('Get payment settings error:', error);
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

// POST - payment required 설정 업데이트
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

    const { clientPortal, serviceRequest, snsSettings } = await request.json();

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

    // Update settings
    const settingsToUpdate = [
      ['require_payment_client_portal', clientPortal],
      ['require_payment_service_request', serviceRequest],
      ['require_payment_sns_settings', snsSettings]
    ];

    for (const [key, value] of settingsToUpdate) {
      if (typeof value === 'boolean') {
        await client.query(
          `INSERT INTO payment_settings (setting_key, setting_value, "updatedAt") 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (setting_key) 
           DO UPDATE SET setting_value = $2, "updatedAt" = NOW()`,
          [key, value]
        );
      }
    }

    await client.end();

    return NextResponse.json({ 
      message: 'Payment settings updated successfully',
      settings: {
        clientPortal: clientPortal ?? true,
        serviceRequest: serviceRequest ?? true,
        snsSettings: snsSettings ?? true
      }
    });

  } catch (error) {
    console.error('Update payment settings error:', error);
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
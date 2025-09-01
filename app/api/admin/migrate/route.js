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

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await client.connect();
    
    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gallery_items' AND column_name = 'images'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add images column
      await client.query(`
        ALTER TABLE gallery_items 
        ADD COLUMN images JSONB DEFAULT '[]'::jsonb
      `);
    }
    
    // Update existing items with empty images array to include their main image
    const updateResult = await client.query(`
      UPDATE gallery_items 
      SET images = jsonb_build_array(
        jsonb_build_object(
          'src', path,
          'alt', title,
          'filename', filename,
          'originalName', "originalName",
          'mimetype', mimetype,
          'size', size,
          'url', path,
          'order', 0
        )
      )
      WHERE images = '[]'::jsonb OR images IS NULL
    `);
    
    await client.end();
    return NextResponse.json({ 
      success: true, 
      message: `Migration completed. Updated ${updateResult.rowCount} items with images array.` 
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import { uploadFile } from '@/lib/supabase';

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

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT * FROM gallery_items ORDER BY "order" ASC'
    );

    await client.end();

    return NextResponse.json({
      success: true,
      items: result.rows
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json(
      { error: 'Failed to fetch gallery items' },
      { status: 500 }
    );
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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description') || '';

    if (!title || !file || file.size === 0) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      );
    }

    // File upload processing with Supabase Storage using admin privileges
    const uploadResult = await uploadFile(file, 'uploads', 'gallery', true);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `File upload failed: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    await client.connect();

    // Get the highest order number and increment
    const lastItemResult = await client.query(
      'SELECT "order" FROM gallery_items ORDER BY "order" DESC LIMIT 1'
    );
    const newOrder = (lastItemResult.rows[0]?.order || 0) + 1;

    // Insert new gallery item
    const id = createId();
    const insertResult = await client.query(
      `INSERT INTO gallery_items (id, title, description, filename, "originalName", mimetype, size, path, "order", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
      [
        id,
        title,
        description,
        uploadResult.filename,
        uploadResult.originalName,
        uploadResult.mimetype,
        uploadResult.size,
        uploadResult.url,
        newOrder
      ]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      item: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Gallery creation error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Failed to create gallery item' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { items } = await request.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    await client.connect();

    // Update order for all items
    for (const item of items) {
      await client.query(
        'UPDATE gallery_items SET "order" = $1, "updatedAt" = NOW() WHERE id = $2',
        [item.order, item.id]
      );
    }

    await client.end();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Gallery order update error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json({ error: 'Failed to update gallery order' }, { status: 500 });
  }
}
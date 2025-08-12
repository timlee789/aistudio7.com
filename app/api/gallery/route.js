import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/supabase';
import { createId } from '@paralleldrive/cuid2';

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

// Get all gallery items (GET)
export async function GET(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM gallery_items WHERE "isActive" = true ORDER BY "order" ASC'
    );
    
    await client.end();

    return NextResponse.json({ items: result.rows }, { status: 200 });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Create new gallery item (POST)
export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description') || '';
    const file = formData.get('file');

    if (!title || !file || file.size === 0) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      );
    }

    // File upload processing with Supabase Storage
    const uploadResult = await uploadFile(file, 'uploads', 'gallery');
    
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

    // Create new gallery item
    const galleryId = createId();
    const insertResult = await client.query(`
      INSERT INTO gallery_items (
        id, title, description, filename, "originalName", mimetype, 
        size, path, "order", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      galleryId, title, description, uploadResult.filename,
      uploadResult.originalName, uploadResult.mimetype,
      uploadResult.size, uploadResult.url, newOrder, true
    ]);

    await client.end();

    return NextResponse.json(
      { message: 'Gallery item created successfully', item: insertResult.rows[0] },
      { status: 201 }
    );

  } catch (error) {
    console.error('Gallery creation error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update gallery items order (PUT)
export async function PUT(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      );
    }

    await client.connect();

    // Update order for each item
    for (let i = 0; i < items.length; i++) {
      await client.query(
        'UPDATE gallery_items SET "order" = $1, "updatedAt" = NOW() WHERE id = $2',
        [i, items[i].id]
      );
    }

    await client.end();

    return NextResponse.json(
      { message: 'Gallery order updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery order update error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
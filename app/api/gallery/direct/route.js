import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { createId } from '@paralleldrive/cuid2';

// Configure for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 60;

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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { title, description, uploadedFiles } = await request.json();

    if (!title || !uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one uploaded file are required' },
        { status: 400 }
      );
    }

    if (uploadedFiles.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 files allowed per portfolio item' },
        { status: 400 }
      );
    }

    await client.connect();

    // Get the highest order number and increment
    const lastItemResult = await client.query(
      'SELECT "order" FROM gallery_items ORDER BY "order" DESC LIMIT 1'
    );
    const newOrder = (lastItemResult.rows[0]?.order || 0) + 1;

    // Process uploaded files data
    const processedFiles = uploadedFiles.map((file, index) => ({
      src: file.url,
      alt: title,
      filename: file.filename,
      originalName: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: file.url,
      publicId: file.publicId,
      order: index
    }));

    // Insert new gallery item
    const id = createId();
    const insertResult = await client.query(
      `INSERT INTO gallery_items (id, title, description, filename, "originalName", mimetype, size, path, "order", "createdAt", "updatedAt", images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10::jsonb) RETURNING *`,
      [
        id,
        title,
        description || '',
        processedFiles[0].filename,
        processedFiles[0].originalName,
        processedFiles[0].mimetype,
        processedFiles[0].size,
        processedFiles[0].url,
        newOrder,
        JSON.stringify(processedFiles)
      ]
    );

    await client.end();

    const item = insertResult.rows[0];
    
    // Parse images JSON for response
    if (item.images) {
      try {
        item.images = JSON.parse(item.images);
      } catch (e) {
        item.images = [];
      }
    }

    return NextResponse.json({
      success: true,
      item: item
    });

  } catch (error) {
    console.error('Gallery direct creation error:', error);
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
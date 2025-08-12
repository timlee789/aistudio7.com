import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { unlink } from 'fs/promises';
import path from 'path';

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

// Delete gallery item (DELETE)
export async function DELETE(request, { params }) {
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

    await client.connect();

    const galleryResult = await client.query(
      'SELECT * FROM gallery_items WHERE id = $1',
      [params.id]
    );

    if (galleryResult.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    const galleryItem = galleryResult.rows[0];

    // Delete file from filesystem
    try {
      const filepath = path.join(process.cwd(), 'public', galleryItem.path);
      await unlink(filepath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await client.query('DELETE FROM gallery_items WHERE id = $1', [params.id]);
    
    await client.end();

    return NextResponse.json(
      { message: 'Gallery item deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery deletion error:', error);
    
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

// Update gallery item (PUT)
export async function PUT(request, { params }) {
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

    const { title, description, isActive } = await request.json();

    await client.connect();

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (isActive !== undefined) {
      updates.push(`"isActive" = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    updates.push(`"updatedAt" = NOW()`);
    values.push(params.id);

    const updateQuery = `
      UPDATE gallery_items 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);
    
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Gallery item updated successfully', item: result.rows[0] },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery update error:', error);
    
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
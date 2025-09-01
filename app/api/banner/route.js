import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/fileUpload';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM main_banners WHERE "isActive" = true ORDER BY "createdAt" DESC LIMIT 1'
    );
    
    await client.end();

    const banner = result.rows[0] || null;
    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Banner fetch error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
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
    // Check authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title') || '';
    const description = formData.get('description') || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage with admin privileges
    const uploadResult = await uploadFile(file, 'uploads', 'banners', true);
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `File upload failed: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    await client.connect();

    // Deactivate existing banners
    await client.query(
      'UPDATE main_banners SET "isActive" = false, "updatedAt" = NOW() WHERE "isActive" = true'
    );

    // Save banner info to database
    const bannerId = createId();
    const insertResult = await client.query(`
      INSERT INTO main_banners (
        id, title, description, filename, "originalName", mimetype, 
        size, path, "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      bannerId, title, description, uploadResult.filename,
      uploadResult.originalName, uploadResult.mimetype,
      uploadResult.size, uploadResult.url, true
    ]);

    await client.end();

    return NextResponse.json({
      message: 'Banner uploaded successfully',
      banner: insertResult.rows[0]
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Failed to upload banner', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bannerId = searchParams.get('id');

    if (!bannerId) {
      return NextResponse.json(
        { error: 'Banner ID is required' },
        { status: 400 }
      );
    }

    await client.connect();

    // Find banner first
    const bannerResult = await client.query(
      'SELECT * FROM main_banners WHERE id = $1',
      [bannerId]
    );

    if (bannerResult.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    const banner = bannerResult.rows[0];

    // Delete from database
    await client.query('DELETE FROM main_banners WHERE id = $1', [bannerId]);
    
    await client.end();

    // Delete physical file (if stored locally)
    try {
      const fs = require('fs').promises;
      const { join } = require('path');
      const filepath = join(process.cwd(), 'public', 'uploads', banner.filename);
      await fs.unlink(filepath);
    } catch (fileError) {
      // Continue even if file deletion fails
      console.log('Local file deletion skipped or failed:', fileError.message);
    }

    return NextResponse.json({
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Banner deletion error:', error);
    
    try {
      await client.end();
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';

// Configure for Vercel deployment
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for large uploads

// Local upload function
async function uploadFileLocally(file, folder = 'gallery') {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}-${Date.now()}-${createId()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      url: `/uploads/${folder}/${fileName}`,
      path: `/uploads/${folder}/${fileName}`
    };

  } catch (error) {
    console.error('Local file upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

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

    // Parse images JSON for each item
    const items = result.rows.map(item => {
      if (item.images) {
        try {
          // If it's already an object/array (JSONB), use it directly
          if (typeof item.images === 'object') {
            item.images = item.images;
          } else {
            // If it's a string, parse it
            item.images = JSON.parse(item.images);
          }
        } catch (e) {
          item.images = [];
        }
      } else {
        item.images = [];
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      items: items
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

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('FormData parsing error:', error);
      return NextResponse.json(
        { error: 'Request Entity Too Large. Please reduce file sizes or upload fewer files.' },
        { status: 413 }
      );
    }
    const files = formData.getAll('files');
    const title = formData.get('title');
    const description = formData.get('description') || '';

    if (!title || files.length === 0 || files.some(file => file.size === 0)) {
      return NextResponse.json(
        { error: 'Title and at least one file are required' },
        { status: 400 }
      );
    }

    if (files.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 files allowed per portfolio item' },
        { status: 400 }
      );
    }

    // Check file sizes - different limits for images and videos
    const maxImageSize = 4 * 1024 * 1024; // 4MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for videos
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 100 * 1024 * 1024; // 100MB total for mixed content

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      const maxSizeMB = isVideo ? 50 : 4;
      
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File "${file.name}" is too large. Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.` },
          { status: 413 }
        );
      }
    }

    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        { error: 'Total file size too large. Maximum total size is 100MB.' },
        { status: 413 }
      );
    }

    await client.connect();

    // Get the highest order number and increment
    const lastItemResult = await client.query(
      'SELECT "order" FROM gallery_items ORDER BY "order" DESC LIMIT 1'
    );
    const newOrder = (lastItemResult.rows[0]?.order || 0) + 1;

    // Upload all files and collect their data
    const uploadedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadResult = await uploadFileLocally(file, 'gallery');
      
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: `File upload failed for file ${i + 1}: ${uploadResult.error}` },
          { status: 500 }
        );
      }
      
      uploadedFiles.push({
        src: uploadResult.url,
        alt: title,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        url: uploadResult.url,
        order: i
      });
    }

    // Insert new gallery item with multiple images
    const id = createId();
    const insertResult = await client.query(
      `INSERT INTO gallery_items (id, title, description, filename, "originalName", mimetype, size, path, "order", "createdAt", "updatedAt", images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), $10::jsonb) RETURNING *`,
      [
        id,
        title,
        description,
        uploadedFiles[0].filename,
        uploadedFiles[0].originalName,
        uploadedFiles[0].mimetype,
        uploadedFiles[0].size,
        uploadedFiles[0].url,
        newOrder,
        JSON.stringify(uploadedFiles)
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
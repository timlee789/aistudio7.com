import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma-new';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/supabase';

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
  try {
    const galleryItems = await prisma.galleryItem.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ items: galleryItems }, { status: 200 });

  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Create new gallery item (POST)
export async function POST(request) {
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

    // Get the highest order number and increment
    const lastItem = await prisma.galleryItem.findFirst({
      orderBy: { order: 'desc' }
    });
    const newOrder = (lastItem?.order || 0) + 1;

    const galleryItem = await prisma.galleryItem.create({
      data: {
        title,
        description,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        path: uploadResult.url,
        order: newOrder
      }
    });

    return NextResponse.json(
      { message: 'Gallery item created successfully', item: galleryItem },
      { status: 201 }
    );

  } catch (error) {
    console.error('Gallery creation error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update gallery items order (PUT)
export async function PUT(request) {
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

    // Update order for each item
    const updatePromises = items.map((item, index) =>
      prisma.galleryItem.update({
        where: { id: item.id },
        data: { order: index }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json(
      { message: 'Gallery order updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery order update error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
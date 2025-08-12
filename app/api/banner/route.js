import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma-new';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/supabase';

export async function GET() {
  try {
    const banner = await prisma.mainBanner.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Banner fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    // Upload file to Supabase Storage
    const uploadResult = await uploadFile(file, 'uploads', 'banners');
    
    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `File upload failed: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    // Deactivate existing banners
    await prisma.mainBanner.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Save banner info to database
    const banner = await prisma.mainBanner.create({
      data: {
        title,
        description,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimetype: uploadResult.mimetype,
        size: uploadResult.size,
        path: uploadResult.url,
        isActive: true
      }
    });

    return NextResponse.json({
      message: 'Banner uploaded successfully',
      banner
    });

  } catch (error) {
    console.error('Banner upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to upload banner', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    // Find and delete banner
    const banner = await prisma.mainBanner.findUnique({
      where: { id: bannerId }
    });

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.mainBanner.delete({
      where: { id: bannerId }
    });

    // Delete physical file
    try {
      const fs = require('fs').promises;
      const filepath = join(process.cwd(), 'public', 'uploads', banner.filename);
      await fs.unlink(filepath);
    } catch (fileError) {
      // Continue even if file deletion fails
    }

    return NextResponse.json({
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Banner deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
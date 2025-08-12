import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma-new';
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
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const galleryItem = await prisma.galleryItem.findUnique({
      where: { id: params.id }
    });

    if (!galleryItem) {
      return NextResponse.json(
        { error: 'Gallery item not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = path.join(process.cwd(), 'public', galleryItem.path);
      await unlink(filepath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.galleryItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Gallery item deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery deletion error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update gallery item (PUT)
export async function PUT(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { title, description, isActive } = await request.json();

    const updatedItem = await prisma.galleryItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(
      { message: 'Gallery item updated successfully', item: updatedItem },
      { status: 200 }
    );

  } catch (error) {
    console.error('Gallery update error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
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

// Create order (POST)
export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const priority = formData.get('priority') || 'NORMAL';
    const dueDate = formData.get('dueDate');
    
    // Generate order number
    const orderCount = await prisma.order.count();
    const orderId = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    // File upload processing with Supabase Storage
    const fileData = [];
    for (let i = 0; formData.get(`file${i}`); i++) {
      const file = formData.get(`file${i}`);
      if (file && file.size > 0) {
        try {
          const uploadResult = await uploadFile(file, 'uploads', 'orders');
          
          if (!uploadResult.success) {
            throw new Error(uploadResult.error);
          }
          
          fileData.push({
            filename: uploadResult.filename,
            originalName: uploadResult.originalName,
            mimetype: uploadResult.mimetype,
            size: uploadResult.size,
            path: uploadResult.url
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return NextResponse.json(
            { error: `File upload failed: ${file.name}` },
            { status: 500 }
          );
        }
      }
    }

    // Mapped priority values
    const priorityMapping = {
      'Normal': 'NORMAL',
      'Urgent': 'URGENT', 
      'Critical': 'CRITICAL'
    };

    const newOrder = await prisma.order.create({
      data: {
        orderId,
        clientId: user.userId,
        title,
        description,
        priority: priorityMapping[priority] || priority,
        dueDate: dueDate ? new Date(dueDate + 'T00:00:00.000Z') : null,
        status: 'PENDING',
        files: {
          create: fileData
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        files: true
      }
    });

    return NextResponse.json(
      { message: 'Order created successfully', order: newOrder },
      { status: 201 }
    );

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Get order list (GET)
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let orders;
    
    if (user.role === 'ADMIN') {
      // Admin can view all orders
      orders = await prisma.order.findMany({
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          },
          files: true,
          adminContent: {
            include: {
              files: true
            }
          },
          feedbacks: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Regular users can only view their own orders
      orders = await prisma.order.findMany({
        where: {
          clientId: user.userId
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          files: true,
          adminContent: {
            include: {
              files: true
            }
          },
          feedbacks: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({ orders }, { status: 200 });

  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
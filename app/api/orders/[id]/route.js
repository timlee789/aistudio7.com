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

// Get order details (GET)
export async function GET(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
        feedbacks: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Permission check (only admin or order owner can view)
    if (user.role !== 'ADMIN' && order.clientId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update order (PUT)
export async function PUT(request, { params }) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Handle FormData or JSON
    let body, action, updateData;
    const contentType = request.headers.get('content-type');
    
    if (contentType && contentType.includes('multipart/form-data')) {
      // Handle FormData (admin content upload)
      const formData = await request.formData();
      action = 'addAdminContent';
      updateData = {
        description: formData.get('description')
      };
      
      // File upload processing with Supabase Storage
      const fileData = [];
      for (let i = 0; formData.get(`file${i}`); i++) {
        const file = formData.get(`file${i}`);
        if (file && file.size > 0) {
          try {
            const uploadResult = await uploadFile(file, 'uploads', 'admin-content');
            
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
      updateData.files = fileData;
    } else {
      // Handle JSON
      const jsonBody = await request.json();
      action = jsonBody.action;
      updateData = jsonBody;
      delete updateData.action;
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    let updatedOrder;

    switch (action) {
      case 'updateStatus':
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }
        updatedOrder = await prisma.order.update({
          where: { id: params.id },
          data: { status: updateData.status },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        break;

      case 'addAdminContent':
        if (user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }
        
        // Check if AdminContent already exists
        const existingAdminContent = await prisma.adminContent.findUnique({
          where: { orderId: params.id }
        });

        if (existingAdminContent) {
          // Update existing AdminContent
          updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: {
              adminContent: {
                update: {
                  description: updateData.description || '',
                  files: {
                    create: updateData.files || []
                  }
                }
              },
              status: 'REVIEW'
            },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              adminContent: {
                include: {
                  files: true
                }
              }
            }
          });
        } else {
          // Create new AdminContent
          updatedOrder = await prisma.order.update({
            where: { id: params.id },
            data: {
              adminContent: {
                create: {
                  description: updateData.description || '',
                  files: {
                    create: updateData.files || []
                  }
                }
              },
              status: 'REVIEW'
            },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              adminContent: {
                include: {
                  files: true
                }
              }
            }
          });
        }
        break;

      case 'addFeedback':
        // Only order owner can add feedback
        if (order.clientId !== user.userId) {
          return NextResponse.json(
            { error: 'Permission denied' },
            { status: 403 }
          );
        }
        
        const newStatus = updateData.type === 'APPROVAL' ? 'COMPLETED' : 'REVISION';
        
        updatedOrder = await prisma.order.update({
          where: { id: params.id },
          data: {
            feedbacks: {
              create: {
                type: updateData.type,
                message: updateData.message,
                userId: user.userId
              }
            },
            status: newStatus
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            feedbacks: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { message: 'Order updated successfully', order: updatedOrder },
      { status: 200 }
    );

  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
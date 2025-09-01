import { NextResponse } from 'next/server';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';
import { uploadFile } from '@/lib/fileUpload';
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

// Create order (POST)
export async function POST(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

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

    await client.connect();
    
    // Generate order number
    const orderCountResult = await client.query('SELECT COUNT(*) FROM orders');
    const orderCount = parseInt(orderCountResult.rows[0].count);
    const orderId = `ORD-${String(orderCount + 1).padStart(3, '0')}`;

    // File upload processing with local storage
    const fileData = [];
    let i = 0;
    
    // Process regular files
    while (formData.get(`file${i}`)) {
      const file = formData.get(`file${i}`);
      if (file && file.size > 0) {
        try {
          const uploadResult = await uploadFile(file, 'orders');
          
          if (!uploadResult.success) {
            throw new Error(`Upload failed for ${file.name}`);
          }
          
          const fileInfo = {
            id: createId(),
            filename: uploadResult.filename,
            originalName: uploadResult.originalName,
            mimetype: uploadResult.mimetype,
            size: uploadResult.size,
            path: uploadResult.url
          };
          
          fileData.push(fileInfo);
        } catch (uploadError) {
          console.error('File processing error:', uploadError);
          await client.end();
          return NextResponse.json(
            { error: `File processing failed: ${file.name} - ${uploadError.message || uploadError}` },
            { status: 500 }
          );
        }
      }
      i++;
    }
    
    // Process AI-generated files
    i = 0;
    while (formData.get(`generatedFile${i}`)) {
      try {
        const generatedFileData = JSON.parse(formData.get(`generatedFile${i}`));
        fileData.push({
          id: createId(),
          filename: generatedFileData.name,
          originalName: generatedFileData.name,
          mimetype: generatedFileData.type,
          size: 0, // AI-generated files don't have file size in our context
          path: generatedFileData.url
        });
      } catch (parseError) {
        console.error('Generated file parsing error:', parseError);
      }
      i++;
    }

    // Mapped priority values
    const priorityMapping = {
      'Normal': 'NORMAL',
      'Urgent': 'URGENT', 
      'Critical': 'CRITICAL'
    };

    const mappedPriority = priorityMapping[priority] || priority;
    const orderDbId = createId();

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders (id, "orderId", "clientId", title, description, priority, "dueDate", status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      orderDbId,
      orderId,
      user.userId,
      title,
      description,
      mappedPriority,
      dueDate ? new Date(dueDate + 'T00:00:00.000Z') : null,
      'PENDING'
    ]);

    const newOrder = orderResult.rows[0];

    // Create files if any
    for (const fileInfo of fileData) {
      await client.query(`
        INSERT INTO files (id, filename, "originalName", mimetype, size, path, "orderId", "uploadedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        fileInfo.id,
        fileInfo.filename,
        fileInfo.originalName,
        fileInfo.mimetype,
        fileInfo.size,
        fileInfo.path,
        orderDbId
      ]);
    }

    // Get user info for response
    const userResult = await client.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [user.userId]
    );

    // Get files for response
    const filesResult = await client.query(
      'SELECT * FROM files WHERE "orderId" = $1',
      [orderDbId]
    );

    await client.end();

    return NextResponse.json(
      { 
        message: 'Order created successfully', 
        order: {
          ...newOrder,
          client: userResult.rows[0] || null,
          files: filesResult.rows || []
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Order creation error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Get order list (GET)
export async function GET(request) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await client.connect();

    let ordersQuery;
    let queryParams = [];
    
    if (user.role === 'ADMIN') {
      // Admin can view all orders
      ordersQuery = `
        SELECT 
          o.*,
          u.id as client_id, u.name as client_name, u.email as client_email, u.company as client_company
        FROM orders o
        LEFT JOIN users u ON o."clientId" = u.id
        ORDER BY o."createdAt" DESC
      `;
    } else {
      // Regular users can only view their own orders
      ordersQuery = `
        SELECT 
          o.*,
          u.id as client_id, u.name as client_name, u.email as client_email
        FROM orders o
        LEFT JOIN users u ON o."clientId" = u.id
        WHERE o."clientId" = $1
        ORDER BY o."createdAt" DESC
      `;
      queryParams = [user.userId];
    }

    const ordersResult = await client.query(ordersQuery, queryParams);
    const orders = ordersResult.rows;

    // Get files for each order
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      // Get order files
      const filesResult = await client.query(
        'SELECT * FROM files WHERE "orderId" = $1',
        [order.id]
      );

      // Get admin content
      const adminContentResult = await client.query(
        'SELECT * FROM admin_contents WHERE "orderId" = $1',
        [order.id]
      );

      let adminContent = null;
      if (adminContentResult.rows.length > 0) {
        const adminContentData = adminContentResult.rows[0];
        
        // Get admin content files
        const adminFilesResult = await client.query(
          'SELECT * FROM files WHERE "adminContentId" = $1',
          [adminContentData.id]
        );

        adminContent = {
          ...adminContentData,
          files: adminFilesResult.rows
        };
      }

      // Get feedbacks
      const feedbacksResult = await client.query(
        'SELECT * FROM feedbacks WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
        [order.id]
      );

      return {
        ...order,
        client: {
          id: order.client_id,
          name: order.client_name,
          email: order.client_email,
          company: order.client_company
        },
        files: filesResult.rows,
        adminContent,
        feedbacks: feedbacksResult.rows
      };
    }));

    await client.end();

    return NextResponse.json({ orders: ordersWithDetails }, { status: 200 });

  } catch (error) {
    console.error('Order fetch error:', error);
    try {
      if (client._connected) {
        await client.end();
      }
    } catch (endError) {
      console.error('Error closing connection:', endError);
    }
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma-new';
import ComfyUIService from '@/lib/comfyui';

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

    const body = await request.json();
    const { orderId, prompt, negativePrompt, options } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    let actualOrderId = orderId;
    
    // If no orderId provided, create a temporary one
    if (!actualOrderId) {
      const tempOrder = await prisma.order.create({
        data: {
          orderId: `AI-${Date.now()}`,
          title: 'AI Generation Request',
          description: `AI generated content with prompt: ${prompt.substring(0, 100)}...`,
          status: 'PENDING',
          priority: 'NORMAL',
          clientId: decoded.userId
        }
      });
      actualOrderId = tempOrder.id;
    } else {
      // Verify order exists and belongs to user
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { client: true }
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Check if user owns the order or is admin
      if (order.clientId !== decoded.userId && decoded.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Test ComfyUI connection first
    const connectionTest = await ComfyUIService.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        { error: 'ComfyUI server is not available', details: connectionTest.error },
        { status: 503 }
      );
    }

    // Generate image using ComfyUI
    const result = await ComfyUIService.generateImage(
      prompt, 
      negativePrompt || "low quality, blurry, artifacts",
      {
        width: options?.width || 1024,
        height: options?.height || 1024,
        steps: options?.steps || 20,
        cfg: options?.cfg || 8
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Image generation failed', details: result.error },
        { status: 500 }
      );
    }

    // Save generation request to database
    const aiGeneration = await prisma.aIGeneration.create({
      data: {
        orderId: actualOrderId,
        prompt: prompt,
        negativePrompt: negativePrompt || "",
        promptId: result.promptId,
        clientId: result.clientId,
        status: 'processing',
        parameters: JSON.stringify(options || {}),
        createdBy: decoded.userId
      }
    });

    return NextResponse.json({
      success: true,
      generationId: aiGeneration.id,
      promptId: result.promptId,
      status: 'processing',
      message: 'Image generation started'
    });

  } catch (error) {
    console.error('AI Generation Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Check generation status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('id');
    const promptId = searchParams.get('promptId');

    if (!generationId && !promptId) {
      return NextResponse.json(
        { error: 'Generation ID or Prompt ID required' },
        { status: 400 }
      );
    }

    // Get generation record from database
    let generation;
    if (generationId) {
      generation = await prisma.aIGeneration.findUnique({
        where: { id: generationId }
      });
    } else {
      generation = await prisma.aIGeneration.findFirst({
        where: { promptId: promptId },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Check ComfyUI for results
    const result = await ComfyUIService.getGenerationResult(generation.promptId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to get generation status', details: result.error },
        { status: 500 }
      );
    }

    // Update database with current status
    if (result.status === 'completed' && generation.status !== 'completed') {
      await prisma.aIGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'completed',
          resultImages: JSON.stringify(result.images || []),
          completedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      status: result.status,
      images: result.images || [],
      progress: result.progress,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt
    });

  } catch (error) {
    console.error('Get generation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
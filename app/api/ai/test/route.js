import { NextResponse } from 'next/server';
import ComfyUIService from '@/lib/comfyui';

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await ComfyUIService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: 'ComfyUI server connection failed',
        details: connectionTest.error
      }, { status: 503 });
    }

    // Test queue status
    const queueTest = await ComfyUIService.getQueueStatus();

    return NextResponse.json({
      success: true,
      message: 'ComfyUI server is running',
      serverInfo: connectionTest.data,
      queueStatus: queueTest.data || null
    });

  } catch (error) {
    console.error('ComfyUI test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
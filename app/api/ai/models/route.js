import { NextResponse } from 'next/server';

const COMFYUI_SERVER = 'http://192.168.1.170:8188';

export async function GET() {
  try {
    // Get available models from ComfyUI
    const response = await fetch(`${COMFYUI_SERVER}/object_info`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const objectInfo = await response.json();
    
    // Extract checkpoint models
    const checkpointLoader = objectInfo['CheckpointLoaderSimple'];
    const availableModels = checkpointLoader?.input?.required?.ckpt_name?.[0] || [];
    
    return NextResponse.json({
      success: true,
      models: availableModels,
      totalModels: availableModels.length
    });

  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get available models',
      details: error.message
    }, { status: 500 });
  }
}
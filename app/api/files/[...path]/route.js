import { NextResponse } from 'next/server';
import { readFromTmp } from '@/lib/tmpFileUpload';

export async function GET(request, { params }) {
  try {
    const { path: pathSegments } = params;
    
    if (!pathSegments || pathSegments.length < 2) {
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    const folder = pathSegments[0]; // e.g., 'gallery', 'banners'
    const filename = pathSegments[1]; // e.g., 'image.jpg'
    
    // Read file from /tmp directory
    const result = await readFromTmp(folder, filename);
    
    if (!result.success) {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    const ext = filename.split('.').pop().toLowerCase();
    const contentType = getContentType(ext);
    
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
  } catch (error) {
    console.error('File serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

function getContentType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}
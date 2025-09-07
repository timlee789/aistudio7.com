import { createId } from '@paralleldrive/cuid2';
import fs from 'fs/promises';
import path from 'path';

export async function uploadToTmp(file, folder = 'gallery') {
  try {
    // Use /tmp directory for Vercel compatibility
    const uploadDir = path.join('/tmp', 'uploads', folder);
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}-${Date.now()}-${createId()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    return {
      success: true,
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      tmpPath: filePath, // Path in /tmp
      url: `/api/files/${folder}/${fileName}`, // API route to serve file
      path: `/api/files/${folder}/${fileName}`
    };

  } catch (error) {
    console.error('Temp file upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function readFromTmp(folder, filename) {
  try {
    const filePath = path.join('/tmp', 'uploads', folder, filename);
    const buffer = await fs.readFile(filePath);
    return { success: true, buffer };
  } catch (error) {
    console.error('Temp file read error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFromTmp(folder, filename) {
  try {
    const filePath = path.join('/tmp', 'uploads', folder, filename);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Temp file delete error:', error);
    return { success: false, error: error.message };
  }
}
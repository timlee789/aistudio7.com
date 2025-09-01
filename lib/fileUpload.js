import { createId } from '@paralleldrive/cuid2';
import fs from 'fs';
import path from 'path';

export async function uploadFile(file, folder = 'gallery') {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}-${Date.now()}-${createId()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    return {
      success: true,
      filename: fileName,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
      url: `/uploads/${folder}/${fileName}`,
      path: `/uploads/${folder}/${fileName}`
    };

  } catch (error) {
    console.error('Local file upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function deleteFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    return { success: true };
  } catch (error) {
    console.error('File delete error:', error);
    return { success: false, error: error.message };
  }
}
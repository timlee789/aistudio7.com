import { uploadToTmp, deleteFromTmp } from '@/lib/tmpFileUpload';

export async function uploadFile(file, uploadPath = 'uploads', folder = 'gallery', isAdmin = false) {
  // Use /tmp directory for Vercel compatibility
  const targetFolder = folder === 'gallery' ? 'gallery' : folder;
  return await uploadToTmp(file, targetFolder);
}

export async function deleteFile(pathOrFilename) {
  try {
    // Extract folder and filename from path
    let folder = 'gallery';
    let filename = pathOrFilename;
    
    if (pathOrFilename.includes('/')) {
      const parts = pathOrFilename.split('/');
      if (parts.includes('api') && parts.includes('files')) {
        // Path like /api/files/gallery/filename.jpg
        const apiIndex = parts.indexOf('files');
        folder = parts[apiIndex + 1];
        filename = parts[apiIndex + 2];
      } else {
        // Extract from regular path
        filename = parts[parts.length - 1];
      }
    }
    
    const result = await deleteFromTmp(folder, filename);
    return result;
  } catch (error) {
    console.error('File delete error:', error);
    return { success: false, error: error.message };
  }
}
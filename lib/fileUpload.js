import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinaryUpload';

export async function uploadFile(file, uploadPath = 'uploads', folder = 'gallery', isAdmin = false) {
  // For compatibility, combine the paths
  const cloudinaryFolder = folder === 'gallery' ? 'gallery' : folder;
  return await uploadToCloudinary(file, cloudinaryFolder);
}

export async function deleteFile(publicIdOrPath) {
  try {
    // Extract public ID from path if needed
    let publicId = publicIdOrPath;
    if (publicIdOrPath.startsWith('/') || publicIdOrPath.startsWith('http')) {
      // Extract public ID from URL or path
      const parts = publicIdOrPath.split('/');
      const lastPart = parts[parts.length - 1];
      publicId = lastPart.split('.')[0]; // Remove extension
    }
    
    const success = await deleteFromCloudinary(publicId);
    return { success };
  } catch (error) {
    console.error('File delete error:', error);
    return { success: false, error: error.message };
  }
}
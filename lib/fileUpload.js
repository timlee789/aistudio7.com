import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinaryUpload';

export async function uploadFile(file, uploadPath = 'uploads', folder = 'gallery', isAdmin = false) {
  // Use Cloudinary for reliable cloud storage
  const cloudinaryFolder = folder === 'gallery' ? 'gallery' : folder;
  return await uploadToCloudinary(file, cloudinaryFolder);
}

export async function deleteFile(publicIdOrPath) {
  try {
    // Extract public ID from Cloudinary URL or use as-is
    let publicId = publicIdOrPath;
    
    if (publicIdOrPath.includes('cloudinary.com')) {
      // Extract public ID from Cloudinary URL
      // Example: https://res.cloudinary.com/cloud/image/upload/v1234567890/aistudio7/gallery/filename.jpg
      const urlParts = publicIdOrPath.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex > -1 && urlParts.length > uploadIndex + 2) {
        // Skip version (v1234567890) and take the rest
        publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
      }
    } else if (publicIdOrPath.includes('/')) {
      // Handle other path formats
      const parts = publicIdOrPath.split('/');
      const lastPart = parts[parts.length - 1];
      publicId = lastPart.split('.')[0];
    }
    
    const success = await deleteFromCloudinary(publicId);
    return { success };
  } catch (error) {
    console.error('File delete error:', error);
    return { success: false, error: error.message };
  }
}
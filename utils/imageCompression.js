// Image compression utility for client-side compression
export async function compressImage(file, maxSizeMB = 1) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        
        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              const sizeMB = blob.size / (1024 * 1024);
              
              if (sizeMB > maxSizeMB && quality > 0.1) {
                // Reduce quality and try again
                quality -= 0.1;
                attemptCompression();
              } else {
                // Create a new File object with the compressed blob
                const compressedFile = new File([blob], file.name, {
                  type: file.type || 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        
        attemptCompression();
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Check if file needs compression
export function needsCompression(file) {
  const isImage = file.type.startsWith('image/');
  const sizeMB = file.size / (1024 * 1024);
  // Compress images larger than 1MB
  return isImage && sizeMB > 1;
}
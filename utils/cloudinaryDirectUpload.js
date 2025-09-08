// Client-side direct upload to Cloudinary (bypasses Vercel size limits)
export async function uploadDirectToCloudinary(file, folder = 'gallery') {
  try {
    // First, get upload signature from our API
    const signatureResponse = await fetch('/api/cloudinary/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        folder: `aistudio7/${folder}`,
        resource_type: file.type.startsWith('video/') ? 'video' : 'image'
      }),
    });

    if (!signatureResponse.ok) {
      throw new Error('Failed to get upload signature');
    }

    const { signature, timestamp, cloudName, apiKey } = await signatureResponse.json();

    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('folder', `aistudio7/${folder}`);
    
    // Add transformations
    if (file.type.startsWith('image/')) {
      formData.append('transformation', 'q_auto,f_auto');
    }
    
    // Upload directly to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${file.type.startsWith('video/') ? 'video' : 'image'}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await uploadResponse.json();

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      filename: result.public_id.split('/').pop(),
      originalName: file.name,
      mimetype: file.type,
      size: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Direct Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
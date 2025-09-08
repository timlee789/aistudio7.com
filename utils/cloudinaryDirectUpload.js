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
      const error = await signatureResponse.text();
      throw new Error(`Failed to get upload signature: ${error}`);
    }

    const { signature, timestamp, cloudName, apiKey, folder: signedFolder } = await signatureResponse.json();

    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', signedFolder || `aistudio7/${folder}`);
    
    // Upload directly to Cloudinary
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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
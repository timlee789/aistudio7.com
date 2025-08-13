import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceKey: !!supabaseServiceKey
  })
}

// Clean URL (remove any trailing spaces or extra characters)
const cleanUrl = supabaseUrl?.trim()

// Public client (with RLS restrictions)
export const supabase = cleanUrl && supabaseAnonKey ? createClient(cleanUrl, supabaseAnonKey) : null

// Admin client (bypasses RLS)
export const supabaseAdmin = cleanUrl && supabaseServiceKey ? createClient(cleanUrl, supabaseServiceKey) : null

// File upload helper with admin privileges
export async function uploadFile(file, bucketName = 'uploads', folder = '', useAdmin = false) {
  console.log('🔧 uploadFile called with:', {
    useAdmin,
    bucketName,
    folder,
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type
  });
  
  const clientToUse = useAdmin && supabaseAdmin ? supabaseAdmin : supabase;
  
  console.log('🔑 Client selection:', {
    useAdmin,
    supabaseAdminAvailable: !!supabaseAdmin,
    supabaseAvailable: !!supabase,
    clientSelected: clientToUse === supabaseAdmin ? 'ADMIN' : clientToUse === supabase ? 'PUBLIC' : 'NONE',
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    supabaseAnonKey: !!supabaseAnonKey
  });
  
  if (!clientToUse) {
    console.error('❌ No Supabase client available');
    return {
      success: false,
      error: 'Supabase client not initialized'
    }
  }

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName
    
    console.log('📁 Preparing upload:', { fileName, filePath, bucketName });

    const { data, error } = await clientToUse.storage
      .from(bucketName)
      .upload(filePath, file)

    console.log('📋 Upload response:', { data, error });

    if (error) {
      console.error('❌ Supabase Storage Error:', error);
      throw error
    }

    // Get public URL
    const { data: urlData } = clientToUse.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return {
      success: true,
      path: filePath,
      url: urlData.publicUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      mimetype: file.type
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete file helper
export async function deleteFile(filePath, bucketName = 'uploads') {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase client not initialized'
    }
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('File delete error:', error)
    return { success: false, error: error.message }
  }
}
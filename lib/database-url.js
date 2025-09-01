// Database URL configuration using environment variables
export function getDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  
  if (!envUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Basic validation
  if (envUrl.length < 80) {
    throw new Error(`DATABASE_URL too short (${envUrl.length} chars)`);
  }
  
  if (!envUrl.includes('supabase.co') && !envUrl.includes('pooler.supabase.com')) {
    throw new Error('DATABASE_URL must be a valid Supabase URL');
  }
  
  try {
    // Try to parse URL
    const testUrl = envUrl.replace('postgresql://', 'http://');
    new URL(testUrl);
    return envUrl;
  } catch (error) {
    throw new Error(`DATABASE_URL parsing failed: ${error.message}`);
  }
}
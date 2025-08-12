// Fallback database URL configuration
export function getDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  
  // Correct database URL (as fallback)
  const fallbackUrl = "postgresql://postgres:Leetim123%21%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres";
  
  console.log('🔍 Database URL check:');
  console.log('  - Environment URL exists:', !!envUrl);
  console.log('  - Environment URL length:', envUrl ? envUrl.length : 0);
  console.log('  - Expected length: 90');
  
  // If environment URL is missing or too short, use fallback
  if (!envUrl || envUrl.length < 80) {
    console.log('⚠️ Using fallback DATABASE_URL due to environment issue');
    return fallbackUrl;
  }
  
  // Validate URL format
  try {
    new URL(envUrl.replace('postgresql://', 'http://'));
    console.log('✅ Environment DATABASE_URL is valid');
    return envUrl;
  } catch (error) {
    console.log('❌ Environment DATABASE_URL is invalid, using fallback');
    return fallbackUrl;
  }
}
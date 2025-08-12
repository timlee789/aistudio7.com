// Multiple database URL configurations to try
export function getDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;
  
  // Multiple possible URLs to try (in order of preference)
  const possibleUrls = [
    envUrl, // Environment variable first
    "postgresql://postgres:Leetim123%21%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres",
    "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres",
    "postgresql://postgres:Leetim123%21%40%23@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
  ];
  
  console.log('🔍 Database URL check:');
  console.log('  - Environment URL exists:', !!envUrl);
  console.log('  - Environment URL length:', envUrl ? envUrl.length : 0);
  console.log('  - Expected length: 90');
  
  // Try each URL in order
  for (let i = 0; i < possibleUrls.length; i++) {
    const url = possibleUrls[i];
    if (!url) continue;
    
    console.log(`  - Trying URL ${i + 1}: ${url.substring(0, 30)}...${url.substring(url.length - 30)}`);
    
    // Basic validation
    if (url.length < 80) {
      console.log(`    ❌ URL too short (${url.length} chars)`);
      continue;
    }
    
    if (!url.includes('supabase.co') && !url.includes('pooler.supabase.com')) {
      console.log(`    ❌ Not a valid Supabase URL`);
      continue;
    }
    
    try {
      // Try to parse URL
      const testUrl = url.replace('postgresql://', 'http://');
      new URL(testUrl);
      console.log(`    ✅ URL ${i + 1} is valid, using this one`);
      return url;
    } catch (error) {
      console.log(`    ❌ URL ${i + 1} parsing failed: ${error.message}`);
    }
  }
  
  // If all fail, return the first fallback
  const fallback = possibleUrls[1];
  console.log('⚠️ All URLs failed validation, using primary fallback');
  return fallback;
}
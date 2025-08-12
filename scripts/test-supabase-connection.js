const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Test multiple possible DATABASE_URL formats
  const testUrls = [
    // Current URL from .env
    process.env.DATABASE_URL,
    
    // Alternative formats to try
    'postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123!@#@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
    'postgresql://postgres:Leetim123%21%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres',
    'postgresql://postgres:Leetim123%21%40%23@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
    
    // Try with different encoding
    'postgresql://postgres:Leetim123!%40%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres',
    'postgresql://postgres:Leetim123%21@%23@db.jevhyocvecfztkyiubeu.supabase.co:5432/postgres'
  ];
  
  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    if (!url) continue;
    
    console.log(`\n${i + 1}️⃣ Testing URL ${i + 1}:`);
    console.log(`   Length: ${url.length}`);
    console.log(`   Preview: ${url.substring(0, 30)}...${url.substring(url.length - 30)}`);
    
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: { url }
        }
      });
      
      // Test connection
      await prisma.$connect();
      console.log('   ✅ Connection successful!');
      
      // Test user count
      const userCount = await prisma.user.count();
      console.log(`   ✅ User count: ${userCount}`);
      
      // Test admin user
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@aistudio7.com' }
      });
      console.log(`   ✅ Admin user exists: ${!!adminUser}`);
      
      await prisma.$disconnect();
      
      console.log(`\n🎉 SUCCESS! Working DATABASE_URL found:`);
      console.log(`DATABASE_URL="${url}"`);
      return url;
      
    } catch (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
    }
  }
  
  console.log('\n💥 No working DATABASE_URL found. Please check:');
  console.log('1. Database password in Supabase');
  console.log('2. Database host and port');
  console.log('3. URL encoding of special characters');
}

testSupabaseConnection().catch(console.error);
#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const DATABASE_URL = "postgresql://postgres.jevhyocvecfztkyiubeu:Leetim123%21%40%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

async function testDatabaseConnection() {
  console.log('🚨 Local Database Test Starting...\n');
  
  let prisma = null;
  
  try {
    console.log('🔗 Creating Prisma client...');
    prisma = new PrismaClient({
      datasources: {
        db: { url: DATABASE_URL }
      },
      log: ['info', 'warn', 'error']
    });

    console.log('🔗 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Test 1: User count
    console.log('📊 Test 1: Counting users...');
    const userCount = await prisma.user.count();
    console.log(`👥 Total users: ${userCount}\n`);

    // Test 2: Find admin user
    console.log('🔍 Test 2: Finding admin user...');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@aistudio7.com' }
    });
    console.log(`🔑 Admin user found: ${!!adminUser}`);
    if (adminUser) {
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
    }
    console.log('');

    // Test 3: Password verification (if admin exists)
    if (adminUser) {
      console.log('🔐 Test 3: Testing admin password...');
      const testPassword = 'admin123!';
      const isPasswordValid = await bcryptjs.compare(testPassword, adminUser.password);
      console.log(`🔐 Password 'admin123!' is valid: ${isPasswordValid}\n`);
    }

    // Test 4: List all users
    console.log('👥 Test 4: Listing all users...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
    console.log('');

    console.log('🎉 All local database tests completed successfully!');
    console.log('✅ Ready to deploy to Vercel!');

  } catch (error) {
    console.error('💥 Local Database Test Failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.log('\n❌ Fix local issues before deploying to Vercel!');
  } finally {
    if (prisma) {
      console.log('\n🔌 Disconnecting from database...');
      await prisma.$disconnect();
      console.log('✅ Disconnected cleanly');
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
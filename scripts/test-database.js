const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test user query
    console.log('🔍 Testing user query...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name}`);
    });
    
    // Test admin user specifically
    console.log('🔍 Testing admin user query...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true, // Include password to verify it exists
        createdAt: true
      }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        hasPassword: !!adminUser.password,
        passwordLength: adminUser.password ? adminUser.password.length : 0,
        createdAt: adminUser.createdAt
      });
    } else {
      console.log('❌ Admin user not found');
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
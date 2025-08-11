const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordVerification() {
  try {
    console.log('🔍 Testing password verification...');
    
    // Get admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found');
    console.log('Stored password hash:', adminUser.password);
    
    // Test password verification
    const testPassword = 'admin123!';
    console.log('Testing password:', testPassword);
    
    const isValid = await bcryptjs.compare(testPassword, adminUser.password);
    console.log('Password validation result:', isValid);
    
    if (isValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
      
      // Let's try to generate a new hash and compare
      console.log('🔍 Generating new hash for comparison...');
      const newHash = await bcryptjs.hash(testPassword, 10);
      console.log('New hash:', newHash);
      
      const isNewValid = await bcryptjs.compare(testPassword, newHash);
      console.log('New hash validation result:', isNewValid);
    }

  } catch (error) {
    console.error('❌ Password test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordVerification();
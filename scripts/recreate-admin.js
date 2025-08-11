const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function recreateAdmin() {
  try {
    console.log('🔄 Recreating admin account with bcryptjs...');
    
    // Delete existing admin if exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@aistudio7.com' }
    });
    
    if (existingAdmin) {
      console.log('🗑️ Deleting existing admin account...');
      await prisma.user.delete({
        where: { email: 'admin@aistudio7.com' }
      });
      console.log('✅ Existing admin account deleted');
    }

    // Create new admin with bcryptjs
    console.log('🔒 Hashing password with bcryptjs...');
    const hashedPassword = await bcryptjs.hash('admin123!', 10);
    console.log('✅ Password hashed successfully');
    console.log('Hash preview:', hashedPassword.substring(0, 20) + '...');
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@aistudio7.com',
        password: hashedPassword,
        company: 'AiStudio7.com',
        phone: '010-0000-0000',
        role: 'ADMIN'
      }
    });

    console.log('✅ New admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Email: admin@aistudio7.com`);
    console.log(`Password: admin123!`);
    console.log(`User ID: ${admin.id}`);
    console.log('-----------------------------------');
    
    // Test password verification immediately
    console.log('🧪 Testing password verification...');
    const isValid = await bcryptjs.compare('admin123!', admin.password);
    console.log('Password verification result:', isValid ? '✅ Valid' : '❌ Invalid');

  } catch (error) {
    console.error('❌ Error recreating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();
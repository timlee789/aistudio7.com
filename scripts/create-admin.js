const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log('Please use the existing admin account or delete it first.');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123!', 10);
    
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

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Email: admin@aistudio7.com`);
    console.log(`Password: admin123!`);
    console.log('-----------------------------------');
    console.log('Please save these credentials and change the password after first login.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
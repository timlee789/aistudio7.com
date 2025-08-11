const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminEmail() {
  try {
    // Find admin with old email
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@navaai.com' }
    });

    if (existingAdmin) {
      // Update to new email
      const updatedAdmin = await prisma.user.update({
        where: { email: 'admin@navaai.com' },
        data: {
          email: 'admin@aistudio7.com',
          company: 'AiStudio7.com'
        }
      });

      console.log('✅ Admin email updated successfully!');
      console.log('-----------------------------------');
      console.log(`New Email: admin@aistudio7.com`);
      console.log(`Password: admin123!`);
      console.log('-----------------------------------');
    } else {
      // Check if admin with new email exists
      const newAdmin = await prisma.user.findUnique({
        where: { email: 'admin@aistudio7.com' }
      });

      if (newAdmin) {
        console.log('✅ Admin account already exists with correct email:');
        console.log('-----------------------------------');
        console.log(`Email: admin@aistudio7.com`);
        console.log(`Password: admin123!`);
        console.log('-----------------------------------');
      } else {
        console.log('❌ No admin account found. Please run create-admin.js first.');
      }
    }

  } catch (error) {
    console.error('❌ Error updating admin email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail();
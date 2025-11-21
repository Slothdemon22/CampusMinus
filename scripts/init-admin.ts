import 'dotenv/config';
import { getPrismaClient } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

async function initAdmin() {
  const adminEmail = process.env.ADMIN_MAIL || 'basil@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

  try {
    const prisma = await getPrismaClient();
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    });

    console.log('Admin user created successfully:', admin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    const prisma = await getPrismaClient();
    await prisma.$disconnect();
  }
}

initAdmin();


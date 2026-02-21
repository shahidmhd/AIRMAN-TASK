const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@airman.com' },
    update: {},
    create: {
      email: 'admin@airman.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      isApproved: true,
    },
  });

  // Create Instructor
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@airman.com' },
    update: {},
    create: {
      email: 'instructor@airman.com',
      password: hashedPassword,
      name: 'John Instructor',
      role: 'INSTRUCTOR',
      isApproved: true,
    },
  });

  // Create Student
  const student = await prisma.user.upsert({
    where: { email: 'student@airman.com' },
    update: {},
    create: {
      email: 'student@airman.com',
      password: hashedPassword,
      name: 'Jane Student',
      role: 'STUDENT',
      isApproved: true,
    },
  });

  console.log('✅ Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Admin:      admin@airman.com      / Password123!');
  console.log('  Instructor: instructor@airman.com / Password123!');
  console.log('  Student:    student@airman.com    / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
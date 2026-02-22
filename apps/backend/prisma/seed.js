const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // ── Tenant 1: Skyways Aviation ──────────────────────────────────
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'skyways-aviation' },
    update: {},
    create: { name: 'Skyways Aviation Academy', slug: 'skyways-aviation', isActive: true },
  });

  // ── Tenant 2: Eagle Flight School ──────────────────────────────
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'eagle-flight-school' },
    update: {},
    create: { name: 'Eagle Flight School', slug: 'eagle-flight-school', isActive: true },
  });

  console.log(`✅ Tenants: ${tenant1.name}, ${tenant2.name}`);

  // ── Users Tenant 1 ──────────────────────────────────────────────
  const t1Users = [
    { email: 'admin@skyways.com',      name: 'Skyways Admin',      role: 'ADMIN',      isApproved: true },
    { email: 'instructor@skyways.com', name: 'Skyways Instructor', role: 'INSTRUCTOR', isApproved: true },
    { email: 'student@skyways.com',    name: 'Skyways Student',    role: 'STUDENT',    isApproved: true },
  ];

  // ── Users Tenant 2 ──────────────────────────────────────────────
  const t2Users = [
    { email: 'admin@eagle.com',      name: 'Eagle Admin',      role: 'ADMIN',      isApproved: true },
    { email: 'instructor@eagle.com', name: 'Eagle Instructor', role: 'INSTRUCTOR', isApproved: true },
    { email: 'student@eagle.com',    name: 'Eagle Student',    role: 'STUDENT',    isApproved: true },
  ];

  for (const u of t1Users) {
    await prisma.user.upsert({
      where: { email_tenantId: { email: u.email, tenantId: tenant1.id } },
      update: {},
      create: { ...u, password: hashedPassword, tenantId: tenant1.id },
    });
  }

  for (const u of t2Users) {
    await prisma.user.upsert({
      where: { email_tenantId: { email: u.email, tenantId: tenant2.id } },
      update: {},
      create: { ...u, password: hashedPassword, tenantId: tenant2.id },
    });
  }

  console.log('✅ Users seeded for both tenants');

  // ── Feature Flags ───────────────────────────────────────────────
  const flags = [
    { key: 'booking_system',      enabled: true,  roles: [] },
    { key: 'quiz_attempts',       enabled: true,  roles: [] },
    { key: 'advanced_reporting',  enabled: false, roles: ['ADMIN'] },
    { key: 'bulk_enrollment',     enabled: false, roles: ['ADMIN', 'INSTRUCTOR'] },
  ];

  for (const flag of flags) {
    for (const tenant of [tenant1, tenant2]) {
      await prisma.featureFlag.upsert({
        where: { tenantId_key: { tenantId: tenant.id, key: flag.key } },
        update: {},
        create: { tenantId: tenant.id, ...flag },
      });
    }
  }

  console.log('✅ Feature flags seeded');
  console.log('\n📋 Demo Credentials:');
  console.log('─────────────────────────────────────────────────');
  console.log('Tenant 1 — Skyways Aviation (x-tenant-id: skyways-aviation)');
  console.log('  Admin:      admin@skyways.com      / Password123!');
  console.log('  Instructor: instructor@skyways.com / Password123!');
  console.log('  Student:    student@skyways.com    / Password123!');
  console.log('─────────────────────────────────────────────────');
  console.log('Tenant 2 — Eagle Flight School (x-tenant-id: eagle-flight-school)');
  console.log('  Admin:      admin@eagle.com        / Password123!');
  console.log('  Instructor: instructor@eagle.com   / Password123!');
  console.log('  Student:    student@eagle.com      / Password123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
const request = require('supertest');
const app     = require('../../src/app');
const prisma  = require('../../src/config/db');
const bcrypt  = require('bcryptjs');

let tenantA, tenantB;
let adminA, adminB;
let tokenA, tokenB;

beforeAll(async () => {
  tenantA = await prisma.tenant.upsert({
    where:  { slug: 'test-tenant-a' },
    update: {},
    create: { name: 'Test School A', slug: 'test-tenant-a', isActive: true },
  });

  tenantB = await prisma.tenant.upsert({
    where:  { slug: 'test-tenant-b' },
    update: {},
    create: { name: 'Test School B', slug: 'test-tenant-b', isActive: true },
  });

  const hashed = await bcrypt.hash('Password123!', 12);

  adminA = await prisma.user.upsert({
    where:  { email_tenantId: { email: 'admin-a@test.com', tenantId: tenantA.id } },
    update: {},
    create: {
      email: 'admin-a@test.com', password: hashed,
      name: 'Admin A', role: 'ADMIN', isApproved: true, tenantId: tenantA.id,
    },
  });

  adminB = await prisma.user.upsert({
    where:  { email_tenantId: { email: 'admin-b@test.com', tenantId: tenantB.id } },
    update: {},
    create: {
      email: 'admin-b@test.com', password: hashed,
      name: 'Admin B', role: 'ADMIN', isApproved: true, tenantId: tenantB.id,
    },
  });

  const resA = await request(app)
    .post('/api/auth/login')
    .set('x-tenant-id', 'test-tenant-a')
    .send({ email: 'admin-a@test.com', password: 'Password123!' });
  tokenA = resA.body.accessToken;

  const resB = await request(app)
    .post('/api/auth/login')
    .set('x-tenant-id', 'test-tenant-b')
    .send({ email: 'admin-b@test.com', password: 'Password123!' });
  tokenB = resB.body.accessToken;
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({
    where: { tenantId: { in: [tenantA.id, tenantB.id] } },
  });
  await prisma.refreshToken.deleteMany({
    where: { userId: { in: [adminA.id, adminB.id] } },
  });
  await prisma.user.deleteMany({
    where: { tenantId: { in: [tenantA.id, tenantB.id] } },
  });
  await prisma.tenant.deleteMany({
    where: { id: { in: [tenantA.id, tenantB.id] } },
  });
  await prisma.$disconnect();
});

describe('Tenant Isolation', () => {

  it('Tenant A admin sees only their own users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', 'test-tenant-a');

    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();

    const leaked = res.body.users.filter(u => u.email === 'admin-b@test.com');
    expect(leaked).toHaveLength(0);
  });

  it('Tenant B admin cannot see Tenant A users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-tenant-id', 'test-tenant-b');

    expect(res.status).toBe(200);

    const leaked = res.body.users.filter(u => u.email === 'admin-a@test.com');
    expect(leaked).toHaveLength(0);
  });

  it('Cross-tenant access is blocked — Tenant A token rejected by Tenant B', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-tenant-id', 'test-tenant-b');

    expect(res.status).toBe(403);
  });

  it('Request without x-tenant-id header is rejected', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
  });

});
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');

const prisma = new PrismaClient();

let adminToken, studentToken, instructorToken;
let studentId, instructorId, tenantId;

beforeAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenant: { slug: 'test-tenant' } } });
    await prisma.booking.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test-integration.com' } } });
    await prisma.tenant.deleteMany({ where: { slug: 'test-tenant' } });

    const tenant = await prisma.tenant.create({
        data: { name: 'Test Tenant', slug: 'test-tenant', isActive: true },
    });
    tenantId = tenant.id;

    const hashedPassword = await bcrypt.hash('Password123!', 12);

    await prisma.user.create({
        data: { email: 'admin@test-integration.com', password: hashedPassword, name: 'Test Admin', role: 'ADMIN', isApproved: true, tenantId },
    });

    const instructor = await prisma.user.create({
        data: { email: 'instructor@test-integration.com', password: hashedPassword, name: 'Test Instructor', role: 'INSTRUCTOR', isApproved: true, tenantId },
    });
    instructorId = instructor.id;

    const student = await prisma.user.create({
        data: { email: 'student@test-integration.com', password: hashedPassword, name: 'Test Student', role: 'STUDENT', isApproved: true, tenantId },
    });
    studentId = student.id;

    const adminLogin = await request(app)
        .post('/api/auth/login')
        .set('x-tenant-id', 'test-tenant')
        .send({ email: 'admin@test-integration.com', password: 'Password123!' });
    adminToken = adminLogin.body.accessToken;

    const instructorLogin = await request(app)
        .post('/api/auth/login')
        .set('x-tenant-id', 'test-tenant')
        .send({ email: 'instructor@test-integration.com', password: 'Password123!' });
    instructorToken = instructorLogin.body.accessToken;

    const studentLogin = await request(app)
        .post('/api/auth/login')
        .set('x-tenant-id', 'test-tenant')
        .send({ email: 'student@test-integration.com', password: 'Password123!' });
    studentToken = studentLogin.body.accessToken;
});

afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.booking.deleteMany({ where: { tenantId } });
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test-integration.com' } } });
    await prisma.tenant.deleteMany({ where: { slug: 'test-tenant' } });
    await prisma.$disconnect();
});

describe('Integration: Full Booking Flow', () => {
    let bookingId;

    it('student can create a booking request', async () => {
        const res = await request(app)
            .post('/api/scheduling/bookings')
            .set('Authorization', `Bearer ${studentToken}`)
            .set('x-tenant-id', 'test-tenant')
            .send({ instructorId, date: '2026-06-01', startTime: '09:00', endTime: '10:00' });

        expect(res.status).toBe(201);
        expect(res.body.booking.status).toBe('REQUESTED');
        bookingId = res.body.booking.id;
    });

    it('detects conflict when same slot is booked again', async () => {
        const res = await request(app)
            .post('/api/scheduling/bookings')
            .set('Authorization', `Bearer ${studentToken}`)
            .set('x-tenant-id', 'test-tenant')
            .send({ instructorId, date: '2026-06-01', startTime: '09:00', endTime: '10:00' });

        expect(res.status).toBe(409);
    });

    it('admin can approve booking', async () => {
        const res = await request(app)
            .patch(`/api/scheduling/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${adminToken}`)
            .set('x-tenant-id', 'test-tenant')
            .send({ status: 'APPROVED' });

        expect(res.status).toBe(200);
        expect(res.body.booking.status).toBe('APPROVED');
    });

    it('student cannot access admin user list', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('Authorization', `Bearer ${studentToken}`)
            .set('x-tenant-id', 'test-tenant');  // ✅ real slug

        expect(res.status).toBe(403);
    });

    it('instructor can mark booking as completed', async () => {
        await request(app)
            .patch(`/api/scheduling/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .set('x-tenant-id', 'test-tenant')
            .send({ status: 'ASSIGNED' });

        const res = await request(app)
            .patch(`/api/scheduling/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${instructorToken}`)
            .set('x-tenant-id', 'test-tenant')
            .send({ status: 'COMPLETED' });

        expect(res.status).toBe(200);
        expect(res.body.booking.status).toBe('COMPLETED');
    });
});

describe('Integration: Auth Flow', () => {
    it('rejects login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('x-tenant-id', 'test-tenant')
            .send({ email: 'student@test-integration.com', password: 'WrongPassword!' });

        expect(res.status).toBe(401);
    });

    it('rejects request without token', async () => {
        const res = await request(app)
            .get('/api/users')
            .set('x-tenant-id', 'test-tenant');  // ✅ real slug, no auth token

        expect(res.status).toBe(401);
    });

    it('returns user profile with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${studentToken}`)
            .set('x-tenant-id', 'test-tenant');

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('student@test-integration.com');
    });
});
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const app = require('../../src/app');

const prisma = new PrismaClient();

let adminToken, studentToken, instructorToken;
let studentId, instructorId;

beforeAll(async () => {
  // Clean test data
  await prisma.booking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test-integration.com' } } });

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // Create test users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test-integration.com',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'ADMIN',
      isApproved: true,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@test-integration.com',
      password: hashedPassword,
      name: 'Test Instructor',
      role: 'INSTRUCTOR',
      isApproved: true,
    },
  });
  instructorId = instructor.id;

  const student = await prisma.user.create({
    data: {
      email: 'student@test-integration.com',
      password: hashedPassword,
      name: 'Test Student',
      role: 'STUDENT',
      isApproved: true,
    },
  });
  studentId = student.id;

  // Login all users
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test-integration.com', password: 'Password123!' });
  adminToken = adminLogin.body.accessToken;

  const instructorLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'instructor@test-integration.com', password: 'Password123!' });
  instructorToken = instructorLogin.body.accessToken;

  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@test-integration.com', password: 'Password123!' });
  studentToken = studentLogin.body.accessToken;
});

afterAll(async () => {
  await prisma.booking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test-integration.com' } } });
  await prisma.$disconnect();
});

// ── Integration Test 1: Full Booking Flow ────────────────────────
describe('Integration: Full Booking Flow', () => {
  let bookingId;

  it('student can create a booking request', async () => {
    const res = await request(app)
      .post('/api/scheduling/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        instructorId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '10:00',
        notes: 'Integration test booking',
      });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe('REQUESTED');
    expect(res.body.booking.studentId).toBe(studentId);
    bookingId = res.body.booking.id;
  });

  it('detects conflict when same slot is booked again', async () => {
    const res = await request(app)
      .post('/api/scheduling/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        instructorId,
        date: '2026-06-01',
        startTime: '09:00',
        endTime: '10:00',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already has a booking/i);
  });

  it('admin can approve booking', async () => {
    const res = await request(app)
      .patch(`/api/scheduling/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('APPROVED');
  });

  it('student cannot access admin user list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('instructor can mark booking as completed', async () => {
    const res = await request(app)
      .patch(`/api/scheduling/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe('COMPLETED');
  });
});

// ── Integration Test 2: Auth Flow ────────────────────────────────
describe('Integration: Auth Flow', () => {
  it('registers a new student successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newstudent@test-integration.com',
        password: 'Password123!',
        name: 'New Student',
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('STUDENT');
    expect(res.body.user.isApproved).toBe(true);
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test-integration.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('student@test-integration.com');
  });
});
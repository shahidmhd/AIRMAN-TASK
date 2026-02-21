const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock prisma
jest.mock('../../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

const prisma = require('../../src/config/db');
const authService = require('../../src/modules/auth/auth.service');

// Set env vars for tests
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test';

describe('Auth Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a student successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'STUDENT',
        isApproved: true,
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: 'test@test.com',
        password: 'Password123!',
        name: 'Test User',
        role: 'STUDENT',
      });

      expect(result.email).toBe('test@test.com');
      expect(result.role).toBe('STUDENT');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        authService.register({ email: 'exists@test.com', password: 'pass', name: 'Test' })
      ).rejects.toMatchObject({ status: 409 });
    });

    it('should hash the password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', name: 'Test', role: 'STUDENT', isApproved: true, createdAt: new Date(),
      });

      await authService.register({ email: 'test@test.com', password: 'Password123!', name: 'Test' });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('Password123!');
      const isHashed = await bcrypt.compare('Password123!', createCall.data.password);
      expect(isHashed).toBe(true);
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'STUDENT',
        isApproved: true,
        password: hashedPassword,
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login({ email: 'test@test.com', password: 'Password123!' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw 401 on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', password: hashedPassword,
        isApproved: true, role: 'STUDENT',
      });

      await expect(
        authService.login({ email: 'test@test.com', password: 'WrongPassword!' })
      ).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 403 if user not approved', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1', email: 'test@test.com', password: hashedPassword,
        isApproved: false, role: 'INSTRUCTOR',
      });

      await expect(
        authService.login({ email: 'test@test.com', password: 'Password123!' })
      ).rejects.toMatchObject({ status: 403 });
    });
  });
});
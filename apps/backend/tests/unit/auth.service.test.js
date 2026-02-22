// Mock prisma BEFORE requiring auth service
jest.mock('../../src/config/db', () => ({
    user: {
      findFirst:  jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
    },
    refreshToken: {
      create:     jest.fn(),
      findUnique: jest.fn(),
      delete:     jest.fn(),
      deleteMany: jest.fn(),
    },
  }));
  
  const bcrypt      = require('bcryptjs');
  const prisma      = require('../../src/config/db');
  const authService = require('../../src/modules/auth/auth.service');
  
  describe('Auth Service', () => {
    beforeEach(() => jest.clearAllMocks());
  
    describe('register', () => {
      it('should register a student successfully', async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
          id: 'user-1', email: 'test@test.com', name: 'Test', role: 'STUDENT', isApproved: true, tenantId: 'tenant-1',
        });
  
        const user = await authService.register({
          email: 'test@test.com', password: 'Password123!', name: 'Test', role: 'STUDENT', tenantId: 'tenant-1',
        });
  
        expect(user.email).toBe('test@test.com');
        expect(prisma.user.create).toHaveBeenCalled();
      });
  
      it('should throw 409 if email already exists', async () => {
        prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
  
        await expect(
          authService.register({ email: 'exists@test.com', password: 'pass', name: 'Test', tenantId: 'tenant-1' })
        ).rejects.toMatchObject({ status: 409 });
      });
  
      it('should hash the password', async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
          id: 'user-1', email: 'test@test.com', name: 'Test', role: 'STUDENT', isApproved: true, tenantId: 'tenant-1',
        });
  
        await authService.register({ email: 'test@test.com', password: 'plaintext', name: 'Test', tenantId: 'tenant-1' });
  
        const createCall = prisma.user.create.mock.calls[0][0];
        expect(createCall.data.password).not.toBe('plaintext');
        const valid = await bcrypt.compare('plaintext', createCall.data.password);
        expect(valid).toBe(true);
      });
    });
  
    describe('login', () => {
      it('should return tokens on valid credentials', async () => {
        const hashed = await bcrypt.hash('Password123!', 12);
        prisma.user.findFirst.mockResolvedValue({
          id: 'user-1', email: 'test@test.com', password: hashed, role: 'STUDENT', isApproved: true, tenantId: 'tenant-1',
        });
        prisma.refreshToken.create.mockResolvedValue({});
  
        const result = await authService.login({ email: 'test@test.com', password: 'Password123!', tenantId: 'tenant-1' });
  
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user.email).toBe('test@test.com');
      });
  
      it('should throw 401 on wrong password', async () => {
        const hashed = await bcrypt.hash('correct', 12);
        prisma.user.findFirst.mockResolvedValue({
          id: 'user-1', email: 'test@test.com', password: hashed, role: 'STUDENT', isApproved: true, tenantId: 'tenant-1',
        });
  
        await expect(
          authService.login({ email: 'test@test.com', password: 'WrongPassword!', tenantId: 'tenant-1' })
        ).rejects.toMatchObject({ status: 401 });
      });
  
      it('should throw 401 if user not found', async () => {
        prisma.user.findFirst.mockResolvedValue(null);
  
        await expect(
          authService.login({ email: 'noone@test.com', password: 'Password123!', tenantId: 'tenant-1' })
        ).rejects.toMatchObject({ status: 401 });
      });
  
      it('should throw 403 if user not approved', async () => {
        const hashed = await bcrypt.hash('Password123!', 12);
        prisma.user.findFirst.mockResolvedValue({
          id: 'user-1', email: 'test@test.com', password: hashed, role: 'STUDENT', isApproved: false, tenantId: 'tenant-1',
        });
  
        await expect(
          authService.login({ email: 'test@test.com', password: 'Password123!', tenantId: 'tenant-1' })
        ).rejects.toMatchObject({ status: 403 });
      });
    });
  });
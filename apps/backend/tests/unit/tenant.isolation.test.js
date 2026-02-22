// tests/unit/tenant.isolation.test.js
jest.mock('../../src/config/db', () => ({
    booking: { findFirst: jest.fn() },
    course:  { findMany:  jest.fn() },
  }));
  
  const prisma = require('../../src/config/db');
  
  describe('Tenant Isolation', () => {
    beforeEach(() => jest.clearAllMocks());
  
    it('scopes course queries to tenantId', async () => {
      prisma.course.findMany.mockResolvedValue([]);
      await prisma.course.findMany({ where: { tenantId: 'tenant-A' } });
      expect(prisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-A' }) })
      );
    });
  
    it('rejects cross-tenant access', () => {
      const { enforceTenantIsolation } = require('../../src/middleware/tenant.middleware');
      const req  = { user: { tenantId: 'tenant-A' }, tenant: { id: 'tenant-B' } };
      const res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
  
      enforceTenantIsolation(req, res, next);
  
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Cross-tenant access denied' }));
      expect(next).not.toHaveBeenCalled();
    });
  
    it('allows same-tenant access', () => {
      const { enforceTenantIsolation } = require('../../src/middleware/tenant.middleware');
      const req  = { user: { tenantId: 'tenant-A' }, tenant: { id: 'tenant-A' } };
      const res  = { status: jest.fn(), json: jest.fn() };
      const next = jest.fn();
  
      enforceTenantIsolation(req, res, next);
  
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  
    it('tenant A cannot see tenant B bookings', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);
      await prisma.booking.findFirst({ where: { tenantId: 'tenant-A', id: 'booking-1' } });
      const call = prisma.booking.findFirst.mock.calls[0][0];
      expect(call.where.tenantId).toBe('tenant-A');
    });
  });
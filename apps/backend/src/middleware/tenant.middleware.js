// ── tenant.middleware.js ─────────────────────────────────────────
const prisma = require('../config/db');

const tenantMiddleware = async (req, res, next) => {
  try {
    // If user already authenticated, use their tenant
    if (req.user?.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.user.tenantId } });
      if (!tenant || !tenant.isActive) {
        return res.status(403).json({ error: 'Tenant not found or inactive' });
      }
      req.tenant = tenant;
      return next();
    }

    const tenantSlug = req.headers['x-tenant-id'] || req.headers['x-tenant-slug'];
    if (!tenantSlug) return res.status(400).json({ error: 'Tenant identifier required' });

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) return res.status(404).json({ error: 'Tenant not found' });

    req.tenant = tenant;
    next();
  } catch (error) { next(error); }
};

// Blocks cross-tenant access even if frontend is tampered
const enforceTenantIsolation = (req, res, next) => {
  if (!req.user || !req.tenant) return next();
  if (req.user.tenantId !== req.tenant.id) {
    return res.status(403).json({ error: 'Cross-tenant access denied' });
  }
  next();
};

module.exports = { tenantMiddleware, enforceTenantIsolation };
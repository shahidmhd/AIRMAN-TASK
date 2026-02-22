// ── rbac.middleware.js ────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
  
  const requireAdmin      = requireRole('ADMIN');
  const requireInstructor = requireRole('INSTRUCTOR', 'ADMIN');
  const requireStudent    = requireRole('STUDENT', 'INSTRUCTOR', 'ADMIN');
  
  module.exports = { requireRole, requireAdmin, requireInstructor, requireStudent };
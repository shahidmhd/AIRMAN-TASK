const requireRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized - not logged in' });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        });
      }
  
      next();
    };
  };
  
  // Admin only
  const requireAdmin = requireRole('ADMIN');
  
  // Instructor or Admin
  const requireInstructor = requireRole('INSTRUCTOR', 'ADMIN');
  
  // Any logged in user
  const requireStudent = requireRole('STUDENT', 'INSTRUCTOR', 'ADMIN');
  
  module.exports = {
    requireRole,
    requireAdmin,
    requireInstructor,
    requireStudent,
  };
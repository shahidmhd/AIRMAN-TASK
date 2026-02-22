// ── auth.middleware.js ────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isApproved: true, tenantId: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account pending approval' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticate };
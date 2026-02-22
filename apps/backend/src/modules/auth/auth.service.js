const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const env = require('../../config/env');

const generateAccessToken = (userId, role, tenantId) => {
  return jwt.sign({ userId, role, tenantId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};

const register = async ({ email, password, name, role, tenantId }) => {
  const existing = await prisma.user.findFirst({
    where: { email, tenantId },
  });
  if (existing) {
    const error = new Error('User already exists');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const isApproved = role === 'STUDENT' ? true : false;

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role: role || 'STUDENT', isApproved, tenantId },
    select: { id: true, email: true, name: true, role: true, isApproved: true, tenantId: true },
  });

  return user;
};

const login = async ({ email, password, tenantId }) => {
  const user = await prisma.user.findFirst({
    where: tenantId ? { email, tenantId } : { email },
  });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (!user.isApproved) {
    const error = new Error('Account pending approval');
    error.status = 403;
    throw error;
  }

  const accessToken  = generateAccessToken(user.id, user.role, user.tenantId);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
    accessToken,
    refreshToken,
  };
};

const refreshTokens = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, name: true, role: true, tenantId: true },
  });

  if (!user) {
    const error = new Error('User not found');
    error.status = 401;
    throw error;
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newAccessToken  = generateAccessToken(user.id, user.role, user.tenantId);
  const newRefreshToken = generateRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({
    data: { token: newRefreshToken, userId: user.id, expiresAt },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
};

module.exports = { register, login, refreshTokens, logout };
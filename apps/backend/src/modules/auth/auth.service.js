const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const env = require('../../config/env');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
};

const register = async ({ email, password, name, role }) => {
  // Only allow STUDENT and INSTRUCTOR to self-register
  const allowedRoles = ['STUDENT', 'INSTRUCTOR'];
  const userRole = allowedRoles.includes(role) ? role : 'STUDENT';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: userRole,
      // Instructors need admin approval, students auto-approved
      isApproved: userRole === 'STUDENT',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      createdAt: true,
    },
  });

  return user;
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (!user.isApproved) {
    const error = new Error('Account pending approval');
    error.status = 403;
    throw error;
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token in DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
};

const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token required');
    error.status = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    const error = new Error('Refresh token expired or not found');
    error.status = 401;
    throw error;
  }

  // Rotate refresh token (delete old, create new)
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const newAccessToken = generateAccessToken(storedToken.user.id, storedToken.user.role);
  const newRefreshToken = generateRefreshToken(storedToken.user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: storedToken.user.id,
      expiresAt,
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
};

module.exports = { register, login, refreshTokens, logout, generateAccessToken, generateRefreshToken };
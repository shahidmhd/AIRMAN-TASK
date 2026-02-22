const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

const getAllUsers = async ({ page = 1, limit = 50, role, tenantId } = {}) => {
  const skip  = (page - 1) * limit;
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (role)     where.role     = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true, email: true, name: true,
        role: true, isApproved: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const approveUser = async (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
    select: { id: true, email: true, name: true, role: true, isApproved: true },
  });
};

const createInstructor = async ({ email, password, name, role, tenantId }) => {
  const existing = await prisma.user.findFirst({
    where: { email, tenantId },
  });

  if (existing) {
    const error = new Error('Email already in use');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'INSTRUCTOR',
      isApproved: true,
      tenantId,
    },
    select: { id: true, email: true, name: true, role: true, isApproved: true },
  });
};

const deleteUser = async (userId) => {
  await prisma.user.delete({ where: { id: userId } });
};

const updateRole = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true, isApproved: true },
  });
};

module.exports = { getAllUsers, approveUser, createInstructor, deleteUser, updateRole };
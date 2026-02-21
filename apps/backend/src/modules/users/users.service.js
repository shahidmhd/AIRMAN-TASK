const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

const getAllUsers = async ({ page = 1, limit = 10, role } = {}) => {
  const skip = (page - 1) * limit;
  const where = role ? { role } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const approveUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
    },
  });
  return user;
};

const createInstructor = async ({ email, password, name }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
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
      role: 'INSTRUCTOR',
      isApproved: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
    },
  });
};

const deleteUser = async (userId) => {
  await prisma.user.delete({ where: { id: userId } });
};

const updateRole = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
    },
  });
};

module.exports = {
  getAllUsers,
  approveUser,
  createInstructor,
  deleteUser,
  updateRole,
};
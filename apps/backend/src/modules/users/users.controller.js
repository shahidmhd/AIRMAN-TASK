const { z } = require('zod');
const usersService = require('./users.service');

const getUsers = async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 10;
      const role  = req.query.role;
      const result = await usersService.getAllUsers({
        page, limit, role,
        tenantId: req.tenant.id, 
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

const approveUser = async (req, res, next) => {
  try {
    const user = await usersService.approveUser(req.params.id);
    res.json({ message: 'User approved', user });
  } catch (error) {
    next(error);
  }
};

const createInstructor = async (req, res, next) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
      });
      const data = schema.parse(req.body);
  
      // ✅ Pass tenantId from middleware
      const instructor = await usersService.createInstructor({
        ...data,
        tenantId: req.tenant.id,
      });
  
      res.status(201).json({ message: 'Instructor created', instructor });
    } catch (error) {
      next(error);
    }
  };

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const deleteUser = async (req, res, next) => {
  try {
    await usersService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const schema = z.object({
      role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await usersService.updateRole(req.params.id, result.data.role);
    res.json({ message: 'Role updated', user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  approveUser,
  createInstructor,
  getMe,
  deleteUser,
  updateUserRole,
};
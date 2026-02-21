const { z } = require('zod');
const usersService = require('./users.service');

const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const result = await usersService.getAllUsers({ page, limit, role });
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
    console.log('Request body:', req.body); 
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    });
    const data = schema.parse(req.body);
    const instructor = await usersService.createInstructor(data);
    res.status(201).json({ message: 'Instructor created', instructor });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, approveUser, createInstructor };
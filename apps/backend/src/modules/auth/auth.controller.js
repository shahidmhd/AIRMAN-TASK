const { z } = require('zod');
const authService = require('./auth.service');

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'INSTRUCTOR']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data);
    res.status(201).json({
      message: user.isApproved
        ? 'Registration successful'
        : 'Registration successful. Waiting for admin approval.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, me };
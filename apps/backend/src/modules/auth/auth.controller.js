const { z } = require('zod');
const authService = require('./auth.service');
const auditService = require('../audit/audit.service');

const register = async (req, res, next) => {
  try {
    const schema = z.object({
      email:    z.string().email(),
      password: z.string().min(8),
      name:     z.string().min(1),
      role:     z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
    });
    const data = schema.parse(req.body);

    // Get tenantId from tenant middleware or header
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant required. Send x-tenant-id header.' });
    }

    const user = await authService.register({ ...data, tenantId });
    res.status(201).json({ message: 'Registered successfully', user });
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const schema = z.object({
      email:    z.string().email(),
      password: z.string().min(1),
    });
    const { email, password } = schema.parse(req.body);

    const tenantId = req.tenant?.id;

    const result = await authService.login({ email, password, tenantId });

    try {
      await auditService.log({
        userId:        result.user.id,
        tenantId:      result.user.tenantId,
        action:        auditService.ACTIONS.USER_LOGIN,
        entity:        'User',
        entityId:      result.user.id,
        correlationId: req.correlationId,
        ipAddress:     req.ip,
        userAgent:     req.headers['user-agent'],
      });
    } catch {}

    res.json(result);
  } catch (error) { next(error); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await authService.refreshTokens(refreshToken);
    res.json(tokens);
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) { next(error); }
};

const me = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) { next(error); }
};

module.exports = { register, login, refresh, logout, me };
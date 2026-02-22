const express = require('express');
const router  = express.Router();
const { authenticate }  = require('../../middleware/auth.middleware');
const { requireAdmin }  = require('../../middleware/rbac.middleware');
const auditService      = require('./audit.service');

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const action = req.query.action;
    const userId = req.query.userId;
    const result = await auditService.getAuditLogs({ tenantId: req.user.tenantId, userId, action, page, limit });
    res.json(result);
  } catch (error) { next(error); }
});

module.exports = router;
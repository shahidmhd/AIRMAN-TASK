const express = require('express');
const router  = express.Router();
const { authenticate }  = require('../../middleware/auth.middleware');
const { requireAdmin }  = require('../../middleware/rbac.middleware');
const featuresService   = require('./features.service');
const auditService      = require('../audit/audit.service');

// Get all flags for tenant
router.get('/', authenticate, async (req, res, next) => {
  try {
    const flags = await featuresService.getFlags(req.user.tenantId);
    res.json({ flags });
  } catch (error) { next(error); }
});

// Update a flag (Admin only)
router.put('/:key', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { enabled, roles } = req.body;
    const flag = await featuresService.setFlag(req.user.tenantId, req.params.key, enabled, roles || []);

    await auditService.log({
      userId:        req.user.id,
      tenantId:      req.user.tenantId,
      action:        auditService.ACTIONS.FEATURE_FLAG_UPDATED,
      entity:        'FeatureFlag',
      entityId:      req.params.key,
      before:        null,
      after:         { enabled, roles },
      correlationId: req.correlationId,
      ipAddress:     req.ip,
    });

    res.json({ message: 'Feature flag updated', flag });
  } catch (error) { next(error); }
});

module.exports = router;
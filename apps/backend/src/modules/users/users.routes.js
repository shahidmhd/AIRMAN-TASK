const express = require('express');
const router  = express.Router();
const usersController                       = require('./users.controller');
const { tenantMiddleware,
        enforceTenantIsolation }            = require('../../middleware/tenant.middleware');
const { authenticate }                      = require('../../middleware/auth.middleware');
const { requireAdmin }                      = require('../../middleware/rbac.middleware');

// ✅ Order: tenant → auth → isolation check → admin role
const guard = [tenantMiddleware, authenticate, enforceTenantIsolation, requireAdmin];

router.get('/',              ...guard, usersController.getUsers);
router.post('/instructors',  ...guard, usersController.createInstructor);
router.patch('/:id/approve', ...guard, usersController.approveUser);
router.patch('/:id/role',    ...guard, usersController.updateUserRole);
router.delete('/:id',        ...guard, usersController.deleteUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');

// All routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/', usersController.getUsers);
router.post('/instructors', usersController.createInstructor);
router.patch('/:id/approve', usersController.approveUser);

module.exports = router;
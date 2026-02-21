const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');

router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [STUDENT, INSTRUCTOR, ADMIN] }
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', usersController.getUsers);

/**
 * @swagger
 * /users/instructors:
 *   post:
 *     summary: Create an instructor account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name:     { type: string, minLength: 2 }
 *     responses:
 *       201:
 *         description: Instructor created
 *       409:
 *         description: Email already in use
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/instructors', usersController.createInstructor);

/**
 * @swagger
 * /users/{id}/approve:
 *   patch:
 *     summary: Approve a user account (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: User ID to approve
 *     responses:
 *       200:
 *         description: User approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:    { $ref: '#/components/schemas/User' }
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.patch('/:id/approve', usersController.approveUser);

module.exports = router;
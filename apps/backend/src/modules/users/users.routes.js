const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireInstructor } = require('../../middleware/rbac.middleware');

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
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, requireAdmin, usersController.getUsers);

/**
 * @swagger
 * /users/instructors:
 *   post:
 *     summary: Create instructor (Admin only)
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
 *               email: { type: string }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Instructor created
 *       403:
 *         description: Forbidden
 */
router.post('/instructors', authenticate, requireAdmin, usersController.createInstructor);

/**
 * @swagger
 * /users/{id}/approve:
 *   patch:
 *     summary: Approve user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User approved
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/approve', authenticate, requireAdmin, usersController.approveUser);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [STUDENT, INSTRUCTOR, ADMIN] }
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/role', authenticate, requireAdmin, usersController.updateUserRole);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', authenticate, requireAdmin, usersController.deleteUser);

module.exports = router;
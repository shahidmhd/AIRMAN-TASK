const express = require('express');
const router = express.Router();
const ctrl = require('./courses.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireInstructor, requireStudent } = require('../../middleware/rbac.middleware');

// ── Lessons FIRST (before /:id to avoid conflicts) ───────────────
router.post('/modules/:moduleId/lessons', authenticate, requireInstructor, ctrl.createLesson);
router.put('/modules/:moduleId/lessons/:lessonId', authenticate, requireInstructor, ctrl.updateLesson);
router.delete('/modules/:moduleId/lessons/:lessonId', authenticate, requireInstructor, ctrl.deleteLesson);

// ── Courses ──────────────────────────────────────────────────────
router.get('/', authenticate, requireStudent, ctrl.getAllCourses);
router.post('/', authenticate, requireInstructor, ctrl.createCourse);
router.get('/:id', authenticate, requireStudent, ctrl.getCourseById);
router.put('/:id', authenticate, requireInstructor, ctrl.updateCourse);
router.delete('/:id', authenticate, requireInstructor, ctrl.deleteCourse);

// ── Modules ──────────────────────────────────────────────────────
router.post('/:courseId/modules', authenticate, requireInstructor, ctrl.createModule);
router.put('/:courseId/modules/:moduleId', authenticate, requireInstructor, ctrl.updateModule);
router.delete('/:courseId/modules/:moduleId', authenticate, requireInstructor, ctrl.deleteModule);

module.exports = router;
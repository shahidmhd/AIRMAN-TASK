const express = require('express');
const router = express.Router();
const ctrl = require('./quizzes.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireInstructor, requireStudent } = require('../../middleware/rbac.middleware');

// Instructor: assign quiz to lesson
router.post('/lessons/:lessonId/quiz', authenticate, requireInstructor, ctrl.createQuiz);

// All logged in: view quiz (answers hidden for students)
router.get('/:quizId', authenticate, requireStudent, ctrl.getQuiz);

// Student: attempt quiz
router.post('/:quizId/attempt', authenticate, requireStudent, ctrl.attemptQuiz);

// Student: get own attempts
router.get('/:quizId/my-attempts', authenticate, requireStudent, ctrl.getMyAttempts);

// Instructor: view all student attempts
router.get('/:quizId/attempts', authenticate, requireInstructor, ctrl.getQuizAttempts);

module.exports = router;
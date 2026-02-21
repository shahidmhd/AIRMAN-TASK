const { z } = require('zod');
const quizzesService = require('./quizzes.service');

// Instructor: assign quiz to lesson
const createQuiz = async (req, res, next) => {
  try {
    const schema = z.object({
      questions: z.array(z.object({
        text: z.string().min(1, 'Question text required'),
        options: z.array(z.string()).min(2, 'At least 2 options required'),
        answer: z.string().min(1, 'Answer required'),
      })).min(1, 'At least 1 question required'),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const quiz = await quizzesService.createQuiz({
      lessonId: req.params.lessonId,
      questions: result.data.questions,
    });

    res.status(201).json(quiz);
  } catch (error) { next(error); }
};

const getQuiz = async (req, res, next) => {
  try {
    const quiz = await quizzesService.getQuiz(req.params.quizId);
    // Hide answers for students
    if (req.user.role === 'STUDENT') {
      quiz.questions = quiz.questions.map(({ answer, ...q }) => q);
    }
    res.json(quiz);
  } catch (error) { next(error); }
};

// Student: attempt quiz
const attemptQuiz = async (req, res, next) => {
  try {
    const schema = z.object({
      answers: z.record(z.string(), z.string()),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Answers required' });
    }

    const attempt = await quizzesService.attemptQuiz({
      quizId: req.params.quizId,
      userId: req.user.id,
      answers: result.data.answers,
    });

    res.status(201).json(attempt);
  } catch (error) { next(error); }
};

// Student: get own attempts
const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await quizzesService.getMyAttempts(req.user.id, req.params.quizId);
    res.json(attempts);
  } catch (error) { next(error); }
};

// Instructor: get all attempts
const getQuizAttempts = async (req, res, next) => {
  try {
    const attempts = await quizzesService.getQuizAttempts(req.params.quizId);
    res.json(attempts);
  } catch (error) { next(error); }
};

module.exports = { createQuiz, getQuiz, attemptQuiz, getMyAttempts, getQuizAttempts };
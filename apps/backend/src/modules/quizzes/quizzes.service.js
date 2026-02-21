const prisma = require('../../config/db');

// Instructor: create quiz for a lesson
const createQuiz = async ({ lessonId, questions }) => {
  // Check lesson exists and is QUIZ type
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    const error = new Error('Lesson not found');
    error.status = 404;
    throw error;
  }

  // Delete existing quiz if any
  await prisma.quiz.deleteMany({ where: { lessonId } });

  return prisma.quiz.create({
    data: {
      lessonId,
      questions: {
        create: questions.map((q) => ({
          text: q.text,
          options: q.options,
          answer: q.answer,
        })),
      },
    },
    include: { questions: true },
  });
};

const getQuiz = async (quizId) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });
  if (!quiz) {
    const error = new Error('Quiz not found');
    error.status = 404;
    throw error;
  }
  return quiz;
};

// Student: attempt quiz
const attemptQuiz = async ({ quizId, userId, answers }) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });

  if (!quiz) {
    const error = new Error('Quiz not found');
    error.status = 404;
    throw error;
  }

  // Score the attempt
  let score = 0;
  const results = quiz.questions.map((q) => {
    const studentAnswer = answers[q.id];
    const isCorrect = studentAnswer === q.answer;
    if (isCorrect) score++;
    return {
      questionId: q.id,
      questionText: q.text,
      studentAnswer,
      correctAnswer: q.answer,
      isCorrect,
    };
  });

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score,
      total: quiz.questions.length,
      answers,
      results,
    },
  });

  return {
    attemptId: attempt.id,
    score,
    total: quiz.questions.length,
    percentage: Math.round((score / quiz.questions.length) * 100),
    passed: score >= Math.ceil(quiz.questions.length * 0.6),
    results,
  };
};

// Student: get own attempts
const getMyAttempts = async (userId, quizId) => {
  return prisma.quizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { createdAt: 'desc' },
  });
};

// Instructor: get all attempts for a quiz
const getQuizAttempts = async (quizId) => {
  return prisma.quizAttempt.findMany({
    where: { quizId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  createQuiz,
  getQuiz,
  attemptQuiz,
  getMyAttempts,
  getQuizAttempts,
};
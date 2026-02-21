const prisma = require('../../config/db');

const createCourse = async ({ title, description, createdById }) => {
  return prisma.course.create({
    data: { title, description, createdById },
    include: { modules: true },
  });
};

const getAllCourses = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const skip = (page - 1) * limit;
  const where = search
    ? { title: { contains: search, mode: 'insensitive' } }
    : {};

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCourseById = async (id) => {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: { quiz: { include: { questions: true } } },
          },
        },
      },
    },
  });
  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }
  return course;
};

const updateCourse = async (id, data) => {
  return prisma.course.update({ where: { id }, data });
};

const deleteCourse = async (id) => {
  return prisma.course.delete({ where: { id } });
};

// ── Modules ──────────────────────────────────────────────────────
const createModule = async ({ title, order, courseId }) => {
  return prisma.module.create({
    data: { title, order: order || 0, courseId },
    include: { lessons: true },
  });
};

const updateModule = async (id, data) => {
  return prisma.module.update({ where: { id }, data });
};

const deleteModule = async (id) => {
  return prisma.module.delete({ where: { id } });
};

// ── Lessons ──────────────────────────────────────────────────────
const createLesson = async ({ title, type, content, order, moduleId }) => {
  return prisma.lesson.create({
    data: { title, type: type || 'TEXT', content, order: order || 0, moduleId },
  });
};

const updateLesson = async (id, data) => {
  return prisma.lesson.update({ where: { id }, data });
};

const deleteLesson = async (id) => {
  return prisma.lesson.delete({ where: { id } });
};

module.exports = {
  createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  createLesson, updateLesson, deleteLesson,
};
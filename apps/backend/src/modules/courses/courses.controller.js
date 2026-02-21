const { z } = require('zod');
const coursesService = require('./courses.service');

// ── Courses ──────────────────────────────────────────────────────
const getCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const result = await coursesService.getAllCourses({ page, limit, search });
    res.json(result);
  } catch (error) { next(error); }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await coursesService.getCourseById(req.params.id);
    res.json(course);
  } catch (error) { next(error); }
};

const createCourse = async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      description: z.string().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    const course = await coursesService.createCourse({
      ...result.data,
      createdById: req.user.id,
    });
    res.status(201).json(course);
  } catch (error) { next(error); }
};

const updateCourse = async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(3).optional(),
      description: z.string().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation Error' });
    }
    const course = await coursesService.updateCourse(req.params.id, result.data);
    res.json(course);
  } catch (error) { next(error); }
};

const deleteCourse = async (req, res, next) => {
  try {
    await coursesService.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) { next(error); }
};

// ── Modules ──────────────────────────────────────────────────────
const createModule = async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2, 'Title required'),
      order: z.number().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    const module = await coursesService.createModule({
      ...result.data,
      courseId: req.params.courseId,
    });
    res.status(201).json(module);
  } catch (error) { next(error); }
};

const updateModule = async (req, res, next) => {
  try {
    const module = await coursesService.updateModule(req.params.moduleId, req.body);
    res.json(module);
  } catch (error) { next(error); }
};

const deleteModule = async (req, res, next) => {
  try {
    await coursesService.deleteModule(req.params.moduleId);
    res.json({ message: 'Module deleted' });
  } catch (error) { next(error); }
};

// ── Lessons ──────────────────────────────────────────────────────
const createLesson = async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().min(2, 'Title required'),
      type: z.enum(['TEXT', 'QUIZ']).default('TEXT'),
      content: z.string().optional(),
      order: z.number().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    const lesson = await coursesService.createLesson({
      ...result.data,
      moduleId: req.params.moduleId,
    });
    res.status(201).json(lesson);
  } catch (error) { next(error); }
};

const updateLesson = async (req, res, next) => {
  try {
    const lesson = await coursesService.updateLesson(req.params.lessonId, req.body);
    res.json(lesson);
  } catch (error) { next(error); }
};

const deleteLesson = async (req, res, next) => {
  try {
    await coursesService.deleteLesson(req.params.lessonId);
    res.json({ message: 'Lesson deleted' });
  } catch (error) { next(error); }
};

module.exports = {
    createCourse,
    getAllCourses: getCourses,
    getCourseById: getCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  };
  
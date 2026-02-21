const { z } = require('zod');
const schedulingService = require('./scheduling.service');

// ── Availability ─────────────────────────────────────────────────

const setAvailability = async (req, res, next) => {
  try {
    const schema = z.object({
      date: z.string().min(1, 'Date required'),
      startTime: z.string().min(1, 'Start time required'),
      endTime: z.string().min(1, 'End time required'),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    const slot = await schedulingService.setAvailability({
      ...result.data,
      instructorId: req.user.id,
    });
    res.status(201).json({ message: 'Availability set', slot });
  } catch (error) { next(error); }
};

const getAvailability = async (req, res, next) => {
  try {
    const { instructorId, date } = req.query;
    const slots = await schedulingService.getAvailability({ instructorId, date });
    res.json({ slots });
  } catch (error) { next(error); }
};

const deleteAvailability = async (req, res, next) => {
  try {
    await schedulingService.deleteAvailability(req.params.id, req.user.id);
    res.json({ message: 'Availability slot deleted' });
  } catch (error) { next(error); }
};

// ── Bookings ─────────────────────────────────────────────────────

const createBooking = async (req, res, next) => {
  try {
    const schema = z.object({
      instructorId: z.string().uuid('Invalid instructor ID'),
      date: z.string().min(1, 'Date required'),
      startTime: z.string().min(1, 'Start time required'),
      endTime: z.string().min(1, 'End time required'),
      notes: z.string().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    const booking = await schedulingService.createBooking({
      ...result.data,
      studentId: req.user.id,
    });
    res.status(201).json({ message: 'Booking requested', booking });
  } catch (error) { next(error); }
};

const getBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const result = await schedulingService.getBookings({
      userId: req.user.id,
      role: req.user.role,
      status,
      page,
      limit,
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await schedulingService.getBookingById(req.params.id);
    res.json({ booking });
  } catch (error) { next(error); }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['APPROVED', 'COMPLETED', 'CANCELLED']),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const booking = await schedulingService.updateBookingStatus({
      bookingId: req.params.id,
      status: result.data.status,
      userId: req.user.id,
      role: req.user.role,
    });
    res.json({ message: `Booking ${result.data.status.toLowerCase()}`, booking });
  } catch (error) { next(error); }
};

// ── Weekly Calendar ──────────────────────────────────────────────

const getWeeklySchedule = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart || new Date().toISOString().split('T')[0];
    const schedule = await schedulingService.getWeeklySchedule({
      userId: req.user.id,
      role: req.user.role,
      weekStart,
    });
    res.json(schedule);
  } catch (error) { next(error); }
};

const getInstructors = async (req, res, next) => {
  try {
    const instructors = await schedulingService.getInstructors();
    res.json({ instructors });
  } catch (error) { next(error); }
};

module.exports = {
  setAvailability,
  getAvailability,
  deleteAvailability,
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getWeeklySchedule,
  getInstructors,
};
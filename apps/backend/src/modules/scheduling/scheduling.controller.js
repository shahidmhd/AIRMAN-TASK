const { z }           = require('zod');
const schedulingService = require('./scheduling.service');

const setAvailability = async (req, res, next) => {
  try {
    const schema = z.object({
      date:      z.string().min(1),
      startTime: z.string().min(1),
      endTime:   z.string().min(1),
    });
    const data = schema.parse(req.body);
    const slot = await schedulingService.setAvailability({ ...data, instructorId: req.user.id, tenantId: req.user.tenantId });
    res.status(201).json({ message: 'Availability set', slot });
  } catch (error) { next(error); }
};

const getAvailability = async (req, res, next) => {
  try {
    const slots = await schedulingService.getAvailability({ tenantId: req.user.tenantId, instructorId: req.query.instructorId, date: req.query.date });
    res.json({ slots });
  } catch (error) { next(error); }
};

const deleteAvailability = async (req, res, next) => {
  try {
    await schedulingService.deleteAvailability(req.params.id, req.user.id);
    res.json({ message: 'Slot deleted' });
  } catch (error) { next(error); }
};

const createBooking = async (req, res, next) => {
  try {
    const schema = z.object({
      instructorId: z.string().uuid(),
      date:         z.string().min(1),
      startTime:    z.string().min(1),
      endTime:      z.string().min(1),
      notes:        z.string().optional(),
    });
    const data    = schema.parse(req.body);
    const booking = await schedulingService.createBooking({ ...data, studentId: req.user.id, tenantId: req.user.tenantId, correlationId: req.correlationId, ipAddress: req.ip });
    res.status(201).json({ message: 'Booking requested', booking });
  } catch (error) { next(error); }
};

const getBookings = async (req, res, next) => {
  try {
    const result = await schedulingService.getBookings({
      userId:   req.user.id,
      role:     req.user.role,
      tenantId: req.user.tenantId,
      status:   req.query.status,
      page:     parseInt(req.query.page)  || 1,
      limit:    parseInt(req.query.limit) || 10,
    });
    res.json(result);
  } catch (error) { next(error); }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const schema  = z.object({ status: z.enum(['APPROVED', 'ASSIGNED', 'COMPLETED', 'CANCELLED']) });
    const { status } = schema.parse(req.body);
    const booking = await schedulingService.updateBookingStatus({ bookingId: req.params.id, status, userId: req.user.id, role: req.user.role, tenantId: req.user.tenantId, correlationId: req.correlationId });
    res.json({ message: `Booking ${status.toLowerCase()}`, booking });
  } catch (error) { next(error); }
};

const getWeeklySchedule = async (req, res, next) => {
  try {
    const weekStart = req.query.weekStart || new Date().toISOString().split('T')[0];
    const schedule  = await schedulingService.getWeeklySchedule({ userId: req.user.id, role: req.user.role, tenantId: req.user.tenantId, weekStart });
    res.json(schedule);
  } catch (error) { next(error); }
};

const getInstructors = async (req, res, next) => {
  try {
    const instructors = await schedulingService.getInstructors(req.user.tenantId);
    res.json({ instructors });
  } catch (error) { next(error); }
};

module.exports = { setAvailability, getAvailability, deleteAvailability, createBooking, getBookings, updateBookingStatus, getWeeklySchedule, getInstructors };
const prisma       = require('../../config/db');
const auditService = require('../audit/audit.service');
const cache        = require('../../services/cache.service');

// ── Availability ──────────────────────────────────────────────────
const setAvailability = async ({ instructorId, tenantId, date, startTime, endTime }) => {
  const existing = await prisma.availability.findFirst({
    where: { instructorId, date: new Date(date), startTime, endTime },
  });
  if (existing) { const e = new Error('Slot already exists'); e.status = 409; throw e; }

  return prisma.availability.create({
    data: { instructorId, tenantId, date: new Date(date), startTime, endTime },
  });
};

const getAvailability = async ({ tenantId, instructorId, date } = {}) => {
  const where = { tenantId };
  if (instructorId) where.instructorId = instructorId;
  if (date)         where.date         = new Date(date);

  return prisma.availability.findMany({
    where,
    include: { instructor: { select: { id: true, name: true, email: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
};

const deleteAvailability = async (id, instructorId) => {
  const slot = await prisma.availability.findUnique({ where: { id } });
  if (!slot) { const e = new Error('Slot not found'); e.status = 404; throw e; }
  if (slot.instructorId !== instructorId) { const e = new Error('Not authorized'); e.status = 403; throw e; }
  return prisma.availability.delete({ where: { id } });
};

// ── Conflict Detection ────────────────────────────────────────────
const hasConflict = async ({ instructorId, date, startTime, endTime, excludeBookingId }) => {
  const where = {
    instructorId,
    date:   new Date(date),
    status: { in: ['REQUESTED', 'APPROVED', 'ASSIGNED'] },
    AND:    [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
  };
  if (excludeBookingId) where.id = { not: excludeBookingId };
  const conflict = await prisma.booking.findFirst({ where });
  return !!conflict;
};

// ── Bookings ──────────────────────────────────────────────────────
const createBooking = async ({ studentId, instructorId, tenantId, date, startTime, endTime, notes, correlationId, ipAddress }) => {
  const conflict = await hasConflict({ instructorId, date, startTime, endTime });
  if (conflict) {
    const e = new Error('Instructor already has a booking in this time slot');
    e.status = 409; throw e;
  }

  const booking = await prisma.booking.create({
    data: { studentId, instructorId, tenantId, date: new Date(date), startTime, endTime, notes, status: 'REQUESTED' },
    include: {
      student:    { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });

  await auditService.log({
    userId: studentId, tenantId, action: auditService.ACTIONS.BOOKING_CREATED,
    entity: 'Booking', entityId: booking.id,
    after: { status: 'REQUESTED', date, startTime, endTime },
    correlationId: correlationId || 'system', ipAddress,
  });

  return booking;
};

const getBookings = async ({ userId, role, tenantId, status, page = 1, limit = 10 }) => {
  const skip  = (page - 1) * limit;
  const where = { tenantId };
  if (role === 'STUDENT')    where.studentId    = userId;
  if (role === 'INSTRUCTOR') where.instructorId = userId;
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where, skip, take: limit,
      include: {
        student:    { select: { id: true, name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getBookingById = async (id, tenantId) => {
  const booking = await prisma.booking.findFirst({
    where: { id, tenantId },
    include: {
      student:    { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!booking) { const e = new Error('Booking not found'); e.status = 404; throw e; }
  return booking;
};

// Status transitions with full workflow: REQUESTED→APPROVED→ASSIGNED→COMPLETED
const updateBookingStatus = async ({ bookingId, status, userId, role, tenantId, correlationId }) => {
  const booking = await getBookingById(bookingId, tenantId);
  const before  = { status: booking.status };

  const allowedTransitions = {
    ADMIN:      ['APPROVED', 'ASSIGNED', 'CANCELLED'],
    INSTRUCTOR: ['ASSIGNED', 'COMPLETED', 'CANCELLED'],
    STUDENT:    ['CANCELLED'],
  };

  if (!allowedTransitions[role]?.includes(status)) {
    const e = new Error(`Role ${role} cannot set status to ${status}`); e.status = 403; throw e;
  }
  if (role === 'STUDENT'    && booking.studentId    !== userId) { const e = new Error('Not authorized'); e.status = 403; throw e; }
  if (role === 'INSTRUCTOR' && booking.instructorId !== userId) { const e = new Error('Not authorized'); e.status = 403; throw e; }

  const data = { status };
  if (status === 'ASSIGNED') data.assignedAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: bookingId }, data,
    include: {
      student:    { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });

  const actionMap = {
    APPROVED:  auditService.ACTIONS.BOOKING_APPROVED,
    ASSIGNED:  auditService.ACTIONS.BOOKING_ASSIGNED,
    COMPLETED: auditService.ACTIONS.BOOKING_COMPLETED,
    CANCELLED: auditService.ACTIONS.BOOKING_CANCELLED,
  };

  await auditService.log({
    userId, tenantId, action: actionMap[status],
    entity: 'Booking', entityId: bookingId,
    before, after: { status },
    correlationId: correlationId || 'system',
  });

  return updated;
};

// ── Weekly Calendar ───────────────────────────────────────────────
const getWeeklySchedule = async ({ userId, role, tenantId, weekStart }) => {
  const start = new Date(weekStart);
  const end   = new Date(weekStart);
  end.setDate(end.getDate() + 7);

  const where = {
    tenantId,
    date:   { gte: start, lt: end },
    status: { in: ['REQUESTED', 'APPROVED', 'ASSIGNED', 'COMPLETED'] },
  };
  if (role === 'STUDENT')    where.studentId    = userId;
  if (role === 'INSTRUCTOR') where.instructorId = userId;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      student:    { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const grouped = {};
  bookings.forEach((b) => {
    const key = b.date.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });

  return { weekStart: start, weekEnd: end, schedule: grouped };
};

const getInstructors = async (tenantId) => {
  const cacheKey = cache.KEYS.instructors(tenantId);
  const cached   = await cache.get(cacheKey);
  if (cached) return cached;

  const instructors = await prisma.user.findMany({
    where: { tenantId, role: 'INSTRUCTOR', isApproved: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  await cache.set(cacheKey, instructors, 120);
  return instructors;
};

module.exports = {
  setAvailability, getAvailability, deleteAvailability,
  hasConflict,
  createBooking, getBookings, getBookingById, updateBookingStatus,
  getWeeklySchedule, getInstructors,
};
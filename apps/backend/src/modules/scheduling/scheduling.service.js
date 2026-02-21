const prisma = require('../../config/db');

// ── Availability ─────────────────────────────────────────────────

const setAvailability = async ({ instructorId, date, startTime, endTime }) => {
  // Check for duplicate
  const existing = await prisma.availability.findFirst({
    where: { instructorId, date: new Date(date), startTime, endTime },
  });
  if (existing) {
    const error = new Error('Availability slot already exists');
    error.status = 409;
    throw error;
  }

  return prisma.availability.create({
    data: {
      instructorId,
      date: new Date(date),
      startTime,
      endTime,
    },
  });
};

const getAvailability = async ({ instructorId, date } = {}) => {
  const where = {};
  if (instructorId) where.instructorId = instructorId;
  if (date) where.date = new Date(date);

  return prisma.availability.findMany({
    where,
    include: {
      instructor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
};

const deleteAvailability = async (id, instructorId) => {
  const slot = await prisma.availability.findUnique({ where: { id } });
  if (!slot) {
    const error = new Error('Availability slot not found');
    error.status = 404;
    throw error;
  }
  if (slot.instructorId !== instructorId) {
    const error = new Error('Not authorized to delete this slot');
    error.status = 403;
    throw error;
  }
  return prisma.availability.delete({ where: { id } });
};

// ── Conflict Detection ───────────────────────────────────────────

const hasConflict = async ({ instructorId, date, startTime, endTime, excludeBookingId }) => {
  const where = {
    instructorId,
    date: new Date(date),
    status: { in: ['REQUESTED', 'APPROVED'] },
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const conflict = await prisma.booking.findFirst({ where });
  return !!conflict;
};

// ── Bookings ─────────────────────────────────────────────────────

const createBooking = async ({ studentId, instructorId, date, startTime, endTime, notes }) => {
  // Check conflict
  const conflict = await hasConflict({ instructorId, date, startTime, endTime });
  if (conflict) {
    const error = new Error('Instructor already has a booking in this time slot');
    error.status = 409;
    throw error;
  }

  return prisma.booking.create({
    data: {
      studentId,
      instructorId,
      date: new Date(date),
      startTime,
      endTime,
      notes,
      status: 'REQUESTED',
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
};

const getBookings = async ({ userId, role, status, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = {};

  // Filter by role
  if (role === 'STUDENT') where.studentId = userId;
  if (role === 'INSTRUCTOR') where.instructorId = userId;
  // ADMIN sees all

  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { id: true, name: true, email: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getBookingById = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }
  return booking;
};

const updateBookingStatus = async ({ bookingId, status, userId, role }) => {
  const booking = await getBookingById(bookingId);

  // Permission checks per status transition
  const allowedTransitions = {
    ADMIN: ['APPROVED', 'CANCELLED'],
    INSTRUCTOR: ['COMPLETED', 'CANCELLED'],
    STUDENT: ['CANCELLED'],
  };

  if (!allowedTransitions[role]?.includes(status)) {
    const error = new Error(`Role ${role} cannot set status to ${status}`);
    error.status = 403;
    throw error;
  }

  // Students can only cancel their own bookings
  if (role === 'STUDENT' && booking.studentId !== userId) {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  // Instructors can only update their own bookings
  if (role === 'INSTRUCTOR' && booking.instructorId !== userId) {
    const error = new Error('Not authorized');
    error.status = 403;
    throw error;
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
};

// ── Weekly Calendar ──────────────────────────────────────────────

const getWeeklySchedule = async ({ userId, role, weekStart }) => {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);

  const where = {
    date: { gte: start, lt: end },
    status: { in: ['REQUESTED', 'APPROVED', 'COMPLETED'] },
  };

  if (role === 'STUDENT') where.studentId = userId;
  if (role === 'INSTRUCTOR') where.instructorId = userId;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      instructor: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  // Group by date
  const grouped = {};
  bookings.forEach((booking) => {
    const dateKey = booking.date.toISOString().split('T')[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(booking);
  });

  return { weekStart: start, weekEnd: end, schedule: grouped };
};

const getInstructors = async () => {
  return prisma.user.findMany({
    where: { role: 'INSTRUCTOR', isApproved: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
};

module.exports = {
  setAvailability,
  getAvailability,
  deleteAvailability,
  hasConflict,
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getWeeklySchedule,
  getInstructors,
};
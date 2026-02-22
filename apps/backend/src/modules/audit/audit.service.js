const prisma = require('../../config/db');

const ACTIONS = {
  USER_LOGIN:          'USER_LOGIN',
  USER_LOGOUT:         'USER_LOGOUT',
  USER_REGISTER:       'USER_REGISTER',
  USER_APPROVED:       'USER_APPROVED',
  USER_ROLE_CHANGED:   'USER_ROLE_CHANGED',
  USER_DELETED:        'USER_DELETED',
  INSTRUCTOR_CREATED:  'INSTRUCTOR_CREATED',
  COURSE_CREATED:      'COURSE_CREATED',
  COURSE_UPDATED:      'COURSE_UPDATED',
  COURSE_DELETED:      'COURSE_DELETED',
  BOOKING_CREATED:     'BOOKING_CREATED',
  BOOKING_APPROVED:    'BOOKING_APPROVED',
  BOOKING_ASSIGNED:    'BOOKING_ASSIGNED',
  BOOKING_COMPLETED:   'BOOKING_COMPLETED',
  BOOKING_CANCELLED:   'BOOKING_CANCELLED',
  BOOKING_ESCALATED:   'BOOKING_ESCALATED',
  FEATURE_FLAG_UPDATED:'FEATURE_FLAG_UPDATED',
};

const log = async ({ userId, tenantId, action, entity, entityId, before, after, correlationId, ipAddress, userAgent }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId:        userId || null,
        tenantId,
        action,
        entity,
        entityId:      entityId || null,
        before:        before   || null,
        after:         after    || null,
        correlationId: correlationId || 'system',
        ipAddress:     ipAddress || null,
        userAgent:     userAgent || null,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};

const getAuditLogs = async ({ tenantId, userId, action, page = 1, limit = 20 }) => {
  const skip  = (page - 1) * limit;
  const where = { tenantId };
  if (userId) where.userId = userId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

module.exports = { log, getAuditLogs, ACTIONS };
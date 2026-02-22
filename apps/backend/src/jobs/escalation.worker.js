const { Worker }   = require('bullmq');
const prisma       = require('../config/db');
const redis        = require('../config/redis');
const auditService = require('../modules/audit/audit.service');

const emailStub = ({ to, subject, body }) => {
  console.log(`📧 [EMAIL] To: ${to} | Subject: ${subject}`);
  console.log(`   ${body}`);
};

const escalationWorker = new Worker('escalation', async (job) => {
  const { bookingId, tenantId } = job.data;
  console.log(`🔄 Escalation check for booking: ${bookingId}`);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student:    { select: { name: true, email: true } },
      instructor: { select: { name: true, email: true } },
    },
  });

  if (!booking || booking.status !== 'APPROVED') return;

  const hours = (Date.now() - new Date(booking.updatedAt).getTime()) / 3600000;
  const THRESHOLD = parseInt(process.env.ESCALATION_HOURS) || 2;
  if (hours < THRESHOLD) return;

  await prisma.booking.update({ where: { id: bookingId }, data: { escalatedAt: new Date() } });

  const admins = await prisma.user.findMany({
    where: { tenantId, role: 'ADMIN', isApproved: true },
    select: { email: true, name: true },
  });

  admins.forEach((admin) =>
    emailStub({
      to:      admin.email,
      subject: `⚠️ Booking Escalation — Instructor Not Assigned`,
      body:    `Booking ${bookingId} for ${booking.student.name} approved ${hours.toFixed(1)}h ago but not yet assigned.`,
    })
  );

  await auditService.log({
    tenantId, action: auditService.ACTIONS.BOOKING_ESCALATED,
    entity: 'Booking', entityId: bookingId,
    before: { escalatedAt: null }, after: { escalatedAt: new Date() },
    correlationId: job.id,
  });

  console.log(`✅ Escalated booking ${bookingId}`);
}, {
  connection: redis,
  concurrency: 5,
});

escalationWorker.on('failed', (job, err) => console.error(`❌ Escalation job failed:`, err.message));

module.exports = escalationWorker;
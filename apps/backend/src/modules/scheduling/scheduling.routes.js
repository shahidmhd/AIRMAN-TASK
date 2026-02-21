const express = require('express');
const router = express.Router();
const ctrl = require('./scheduling.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin, requireInstructor, requireStudent } = require('../../middleware/rbac.middleware');

// ── Instructors list (for booking form) ──────────────────────────
router.get('/instructors', authenticate, requireStudent, ctrl.getInstructors);

// ── Availability ─────────────────────────────────────────────────
router.post('/availability', authenticate, requireInstructor, ctrl.setAvailability);
router.get('/availability', authenticate, requireStudent, ctrl.getAvailability);
router.delete('/availability/:id', authenticate, requireInstructor, ctrl.deleteAvailability);

// ── Bookings ─────────────────────────────────────────────────────
router.post('/bookings', authenticate, requireStudent, ctrl.createBooking);
router.get('/bookings', authenticate, requireStudent, ctrl.getBookings);
router.get('/bookings/:id', authenticate, requireStudent, ctrl.getBookingById);
router.patch('/bookings/:id/status', authenticate, requireStudent, ctrl.updateBookingStatus);

// ── Calendar ─────────────────────────────────────────────────────
router.get('/schedule/weekly', authenticate, requireStudent, ctrl.getWeeklySchedule);

module.exports = router;
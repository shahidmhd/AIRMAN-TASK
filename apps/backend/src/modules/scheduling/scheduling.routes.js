const express = require('express');
const router  = express.Router();
const ctrl    = require('./scheduling.controller');
const { authenticate }   = require('../../middleware/auth.middleware');
const { requireInstructor, requireStudent } = require('../../middleware/rbac.middleware');

router.get('/instructors',            authenticate, requireStudent,    ctrl.getInstructors);
router.post('/availability',          authenticate, requireInstructor, ctrl.setAvailability);
router.get('/availability',           authenticate, requireStudent,    ctrl.getAvailability);
router.delete('/availability/:id',    authenticate, requireInstructor, ctrl.deleteAvailability);
router.post('/bookings',              authenticate, requireStudent,    ctrl.createBooking);
router.get('/bookings',               authenticate, requireStudent,    ctrl.getBookings);
router.patch('/bookings/:id/status',  authenticate, requireStudent,    ctrl.updateBookingStatus);
router.get('/schedule/weekly',        authenticate, requireStudent,    ctrl.getWeeklySchedule);

module.exports = router;
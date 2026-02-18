const express = require('express');
const router = express.Router();
const {
    bookAppointment,
    confirmAppointment,
    completeAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAppointmentTimeline,
    getMyAppointments,
    getAllAppointments,
} = require('../controllers/appointmentController');
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { bookAppointmentValidation, rescheduleValidation } = require('../validators/appointmentValidator');

// GET /api/appointments/all — admin only
router.get('/all', authenticate, roleCheck('admin'), getAllAppointments);

// GET /api/appointments — user's own appointments
router.get('/', authenticate, getMyAppointments);

// GET /api/appointments/:id/timeline — status history timeline
router.get('/:id/timeline', authenticate, getAppointmentTimeline);

// POST /api/appointments — book (user only)
router.post('/', authenticate, roleCheck('user'), bookAppointmentValidation, bookAppointment);

// PATCH /api/appointments/:id/confirm — provider confirms
router.patch('/:id/confirm', authenticate, roleCheck('provider'), confirmAppointment);

// PATCH /api/appointments/:id/complete — provider marks complete
router.patch('/:id/complete', authenticate, roleCheck('provider'), completeAppointment);

// PUT /api/appointments/:id — reschedule (user only)
router.put('/:id', authenticate, roleCheck('user'), rescheduleValidation, rescheduleAppointment);

// DELETE /api/appointments/:id — cancel (user only)
router.delete('/:id', authenticate, roleCheck('user'), cancelAppointment);

module.exports = router;

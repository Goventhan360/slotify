const express = require('express');
const router = express.Router();
const { joinWaitlist, getMyWaitlist, leaveWaitlist } = require('../controllers/waitlistController');
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// POST /api/waitlist — join waitlist
router.post('/', authenticate, roleCheck('user'), joinWaitlist);

// GET /api/waitlist — user's waitlist entries
router.get('/', authenticate, getMyWaitlist);

// DELETE /api/waitlist/:id — leave waitlist
router.delete('/:id', authenticate, roleCheck('user'), leaveWaitlist);

module.exports = router;

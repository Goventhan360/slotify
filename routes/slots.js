const express = require('express');
const router = express.Router();
const { getSlots, createSlot, updateSlot, deleteSlot } = require('../controllers/slotController');
const authenticate = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { createSlotValidation } = require('../validators/appointmentValidator');

// GET /api/slots — anyone can view available slots; providers with ?all=true see all their own
router.get('/', optionalAuth, getSlots);

// POST /api/slots — provider only
router.post('/', authenticate, roleCheck('provider'), createSlotValidation, createSlot);

// PUT /api/slots/:id — provider only
router.put('/:id', authenticate, roleCheck('provider'), updateSlot);

// DELETE /api/slots/:id — provider only
router.delete('/:id', authenticate, roleCheck('provider'), deleteSlot);

module.exports = router;

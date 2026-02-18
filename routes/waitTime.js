const express = require('express');
const router = express.Router();
const { getWaitTime } = require('../controllers/waitTimeController');

// GET /api/wait-time/:providerId — public wait time estimate
router.get('/:providerId', getWaitTime);

module.exports = router;

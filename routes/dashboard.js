const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/dashboard — provider analytics
router.get('/', authenticate, roleCheck('provider'), getDashboard);

module.exports = router;

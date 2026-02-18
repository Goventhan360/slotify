const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatbotController');
const authenticate = require('../middleware/auth');

// POST /api/chat — conversational booking assistant (auth optional for greetings/help)
router.post('/', (req, res, next) => {
    // Try to authenticate but don't block if no token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authenticate(req, res, next);
    }
    next();
}, chat);

module.exports = router;

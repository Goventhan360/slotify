const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const authenticate = require('../middleware/auth');
const { User } = require('../models');

// POST /api/register
router.post('/register', registerValidation, register);

// POST /api/login
router.post('/login', loginValidation, login);

// GET /api/me — verify token and return current user info
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'role'],
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

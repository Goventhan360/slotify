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
const { Provider } = require('../models');

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'role'],
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Self-healing: Ensure provider profile exists
        if (user.role === 'provider') {
            const providerProfile = await Provider.findOne({ where: { userId: user.id } });
            if (!providerProfile) {
                await Provider.create({
                    userId: user.id,
                    specialization: 'General',
                    phone: null,
                });
            }
        }

        res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

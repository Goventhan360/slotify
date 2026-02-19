const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const authenticate = require('../middleware/auth');
const { User, Provider } = require('../models');

// Google OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/unauthorized', session: false }),
    (req, res) => {
        // Successful authentication, redirect to frontend with token
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Redirect to frontend (relative path works for both local and prod if served from same origin)
        // If frontend is separate, this should be an env var like FRONTEND_URL
        res.redirect(`/?token=${token}`);
    }
);

// POST /api/register
router.post('/register', registerValidation, register);

// POST /api/login
router.post('/login', loginValidation, login);

// GET /api/me — verify token and return current user info
// Provider is already imported at the top


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

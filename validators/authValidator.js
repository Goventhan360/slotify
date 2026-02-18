const { body } = require('express-validator');

const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/\d/).withMessage('Password must contain at least one number'),

    body('role')
        .optional()
        .isIn(['user', 'provider', 'admin']).withMessage('Role must be user, provider, or admin'),

    body('specialization')
        .if(body('role').equals('provider'))
        .notEmpty().withMessage('Specialization is required for providers'),

    body('phone')
        .optional()
        .isMobilePhone().withMessage('Must be a valid phone number'),
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidation, loginValidation };

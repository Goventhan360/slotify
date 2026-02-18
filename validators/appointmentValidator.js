const { body } = require('express-validator');

const createSlotValidation = [
    body('date')
        .notEmpty().withMessage('Date is required')
        .isDate().withMessage('Must be a valid date (YYYY-MM-DD)'),

    body('startTime')
        .notEmpty().withMessage('Start time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be in HH:MM format'),

    body('endTime')
        .notEmpty().withMessage('End time is required')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be in HH:MM format'),
];

const bookAppointmentValidation = [
    body('slotId')
        .notEmpty().withMessage('Slot ID is required')
        .isInt({ min: 1 }).withMessage('Slot ID must be a positive integer'),

    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
];

const rescheduleValidation = [
    body('newSlotId')
        .notEmpty().withMessage('New slot ID is required')
        .isInt({ min: 1 }).withMessage('New slot ID must be a positive integer'),
];

module.exports = { createSlotValidation, bookAppointmentValidation, rescheduleValidation };

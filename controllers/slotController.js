const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { AppointmentSlot, Provider, User } = require('../models');

// GET /api/slots — list available slots (or all provider slots with ?all=true)
const getSlots = async (req, res, next) => {
    try {
        const { date, providerId } = req.query;
        const where = {};

        // If provider requests ?all=true, show all their own slots
        if (req.query.all === 'true' && req.user) {
            const provider = await Provider.findOne({ where: { userId: req.user.id } });
            if (provider) {
                where.providerId = provider.id;
            } else {
                where.isAvailable = true; // fallback for non-providers
            }
        } else {
            where.isAvailable = true;
        }

        if (date) where.date = date;
        if (providerId) where.providerId = providerId;

        const slots = await AppointmentSlot.findAll({
            where,
            include: [
                {
                    model: Provider,
                    as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                },
            ],
            order: [['date', 'ASC'], ['startTime', 'ASC']],
        });

        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/slots — provider creates a slot (with conflict detection)
const createSlot = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.',
            });
        }

        const { date, startTime, endTime } = req.body;

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time.',
            });
        }

        // 🔒 Conflict Detection — check for overlapping slots
        const conflicting = await AppointmentSlot.findOne({
            where: {
                providerId: provider.id,
                date,
                [Op.or]: [
                    // New slot starts during existing slot
                    { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
                ],
            },
        });

        if (conflicting) {
            return res.status(409).json({
                success: false,
                message: `Conflict detected! Overlapping slot exists: ${conflicting.startTime} - ${conflicting.endTime} on ${conflicting.date}.`,
                conflictingSlot: {
                    id: conflicting.id,
                    date: conflicting.date,
                    startTime: conflicting.startTime,
                    endTime: conflicting.endTime,
                },
            });
        }

        const slot = await AppointmentSlot.create({
            providerId: provider.id,
            date,
            startTime,
            endTime,
            isAvailable: true,
        });

        res.status(201).json({
            success: true,
            message: 'Slot created successfully.',
            data: slot,
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/slots/:id — provider updates a slot
const updateSlot = async (req, res, next) => {
    try {
        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.',
            });
        }

        const slot = await AppointmentSlot.findOne({
            where: { id: req.params.id, providerId: provider.id },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found or unauthorized.',
            });
        }

        const { date, startTime, endTime, isAvailable } = req.body;

        if (date) slot.date = date;
        if (startTime) slot.startTime = startTime;
        if (endTime) slot.endTime = endTime;
        if (isAvailable !== undefined) slot.isAvailable = isAvailable;

        await slot.save();

        res.status(200).json({
            success: true,
            message: 'Slot updated successfully.',
            data: slot,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/slots/:id — provider deletes a slot
const deleteSlot = async (req, res, next) => {
    try {
        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.',
            });
        }

        const slot = await AppointmentSlot.findOne({
            where: { id: req.params.id, providerId: provider.id },
        });

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found or unauthorized.',
            });
        }

        await slot.destroy();

        res.status(200).json({
            success: true,
            message: 'Slot deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSlots, createSlot, updateSlot, deleteSlot };

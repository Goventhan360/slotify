const { Waitlist, AppointmentSlot, Provider, User } = require('../models');
const { notifyWaitlistJoined } = require('../utils/notification');

// POST /api/waitlist — join waitlist for a full slot
const joinWaitlist = async (req, res, next) => {
    try {
        const { slotId } = req.body;

        if (!slotId) {
            return res.status(400).json({ success: false, message: 'slotId is required.' });
        }

        const slot = await AppointmentSlot.findByPk(slotId, {
            include: [{
                model: Provider, as: 'provider',
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            }],
        });

        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found.' });
        }

        if (slot.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Slot is available — book it directly instead of joining the waitlist.',
                hint: 'POST /api/appointments with { "slotId": ' + slotId + ' }',
            });
        }

        // Check if already on waitlist
        const existing = await Waitlist.findOne({
            where: { userId: req.user.id, slotId, status: 'waiting' },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: `You are already on the waitlist at position #${existing.position}.`,
            });
        }

        // Get next position
        const maxPos = await Waitlist.max('position', { where: { slotId, status: 'waiting' } });
        const position = (maxPos || 0) + 1;

        const entry = await Waitlist.create({
            userId: req.user.id,
            slotId,
            position,
            status: 'waiting',
        });

        const user = await User.findByPk(req.user.id);
        notifyWaitlistJoined(user.email, slot.provider.user.name, slot.date, slot.startTime, position);

        res.status(201).json({
            success: true,
            message: `Added to waitlist at position #${position}.`,
            data: entry,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/waitlist — user's waitlist entries
const getMyWaitlist = async (req, res, next) => {
    try {
        const entries = await Waitlist.findAll({
            where: { userId: req.user.id },
            include: [{
                model: AppointmentSlot, as: 'slot',
                include: [{
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                }],
            }],
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/waitlist/:id — leave waitlist
const leaveWaitlist = async (req, res, next) => {
    try {
        const entry = await Waitlist.findOne({
            where: { id: req.params.id, userId: req.user.id, status: 'waiting' },
        });

        if (!entry) {
            return res.status(404).json({ success: false, message: 'Waitlist entry not found.' });
        }

        entry.status = 'expired';
        await entry.save();

        res.status(200).json({ success: true, message: 'Removed from waitlist.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { joinWaitlist, getMyWaitlist, leaveWaitlist };

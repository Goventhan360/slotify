const { Op } = require('sequelize');
const { Appointment, AppointmentSlot, Provider } = require('../models');

// GET /api/wait-time/:providerId — smart wait time prediction
const getWaitTime = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        const provider = await Provider.findByPk(providerId);
        if (!provider) {
            return res.status(404).json({ success: false, message: 'Provider not found.' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get all booked/pending/confirmed appointments for today
        const pendingAppointments = await Appointment.findAll({
            where: {
                providerId: provider.id,
                status: { [Op.in]: ['pending', 'confirmed'] },
            },
            include: [{
                model: AppointmentSlot,
                as: 'slot',
                where: { date: { [Op.gte]: today } },
            }],
            order: [[{ model: AppointmentSlot, as: 'slot' }, 'startTime', 'ASC']],
        });

        // Calculate average appointment duration (in minutes)
        let totalDuration = 0;
        const slots = await AppointmentSlot.findAll({
            where: { providerId: provider.id },
        });

        slots.forEach((slot) => {
            const [sh, sm] = slot.startTime.split(':').map(Number);
            const [eh, em] = slot.endTime.split(':').map(Number);
            totalDuration += (eh * 60 + em) - (sh * 60 + sm);
        });

        const avgDuration = slots.length > 0 ? Math.round(totalDuration / slots.length) : 30;

        // Pending count ahead
        const pendingCount = pendingAppointments.length;

        // Estimated wait time
        const estimatedWaitMinutes = avgDuration * pendingCount;

        // Format wait time nicely
        let waitTimeFormatted;
        if (estimatedWaitMinutes === 0) {
            waitTimeFormatted = 'No wait — slots available!';
        } else if (estimatedWaitMinutes < 60) {
            waitTimeFormatted = `~${estimatedWaitMinutes} minutes`;
        } else {
            const hours = Math.floor(estimatedWaitMinutes / 60);
            const mins = estimatedWaitMinutes % 60;
            waitTimeFormatted = `~${hours}h ${mins}m`;
        }

        // Next available slot
        const nextSlot = await AppointmentSlot.findOne({
            where: { providerId: provider.id, isAvailable: true, date: { [Op.gte]: today } },
            order: [['date', 'ASC'], ['startTime', 'ASC']],
        });

        res.status(200).json({
            success: true,
            data: {
                providerId: provider.id,
                averageAppointmentDuration: `${avgDuration} minutes`,
                appointmentsAhead: pendingCount,
                estimatedWaitTime: waitTimeFormatted,
                estimatedWaitMinutes,
                nextAvailableSlot: nextSlot ? {
                    date: nextSlot.date,
                    time: `${nextSlot.startTime} - ${nextSlot.endTime}`,
                    slotId: nextSlot.id,
                } : 'No available slots',
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getWaitTime };

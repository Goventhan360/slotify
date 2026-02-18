const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Appointment, AppointmentSlot, Provider, User } = require('../models');

// GET /api/dashboard — provider dashboard analytics
const getDashboard = async (req, res, next) => {
    try {
        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Today's bookings
        const todayBookings = await Appointment.count({
            where: { providerId: provider.id, status: { [Op.notIn]: ['cancelled'] } },
            include: [{ model: AppointmentSlot, as: 'slot', where: { date: today }, attributes: [] }],
        });

        // Upcoming appointments (future, not cancelled)
        const upcoming = await Appointment.findAll({
            where: { providerId: provider.id, status: { [Op.notIn]: ['cancelled'] } },
            include: [{
                model: AppointmentSlot, as: 'slot',
                where: { date: { [Op.gte]: today } },
            }],
            order: [[{ model: AppointmentSlot, as: 'slot' }, 'date', 'ASC']],
            limit: 10,
        });

        // Status counts
        const statusCounts = await Appointment.findAll({
            where: { providerId: provider.id },
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'count']],
            group: ['status'],
            raw: true,
        });

        const counts = {};
        statusCounts.forEach((s) => { counts[s.status] = parseInt(s.count); });

        // Total slots vs available
        const totalSlots = await AppointmentSlot.count({ where: { providerId: provider.id } });
        const availableSlots = await AppointmentSlot.count({ where: { providerId: provider.id, isAvailable: true } });

        // Busiest day — which date has most appointments
        const busiestDay = await Appointment.findAll({
            where: { providerId: provider.id, status: { [Op.notIn]: ['cancelled'] } },
            include: [{ model: AppointmentSlot, as: 'slot', attributes: ['date'] }],
            attributes: [[sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'count']],
            group: ['slot.date'],
            order: [[sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'DESC']],
            limit: 1,
            raw: true,
            nest: true,
        });

        res.status(200).json({
            success: true,
            data: {
                todayBookings,
                upcoming: upcoming.map((a) => ({
                    appointmentId: a.id,
                    patient: a.userId,
                    date: a.slot.date,
                    time: `${a.slot.startTime} - ${a.slot.endTime}`,
                    status: a.status,
                })),
                statusBreakdown: {
                    pending: counts.pending || 0,
                    confirmed: counts.confirmed || 0,
                    completed: counts.completed || 0,
                    cancelled: counts.cancelled || 0,
                    rescheduled: counts.rescheduled || 0,
                },
                slots: {
                    total: totalSlots,
                    available: availableSlots,
                    booked: totalSlots - availableSlots,
                },
                busiestDay: busiestDay.length > 0 ? busiestDay[0].slot?.date || 'N/A' : 'No data yet',
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboard };

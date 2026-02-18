const { Op } = require('sequelize');
const { Appointment, AppointmentSlot, Provider, User, StatusHistory, Waitlist } = require('../models');
const { notifyAutoCancel, notifyWaitlistPromotion } = require('./notification');

/**
 * Auto Cancel Job
 * Cancels pending appointments that haven't been confirmed within X hours.
 * Frees the slot and promotes from waitlist.
 */
const startAutoCancelJob = () => {
    const cancelHours = parseInt(process.env.AUTO_CANCEL_HOURS) || 2;
    const intervalMs = parseInt(process.env.AUTO_CANCEL_INTERVAL_MS) || 1800000; // 30 minutes

    console.log(`⏰ Auto-cancel job started: checks every ${intervalMs / 60000}min, cancels after ${cancelHours}h`);

    const runJob = async () => {
        try {
            const cutoff = new Date(Date.now() - cancelHours * 60 * 60 * 1000);

            const expiredAppointments = await Appointment.findAll({
                where: {
                    status: 'pending',
                    createdAt: { [Op.lt]: cutoff },
                },
                include: [{
                    model: AppointmentSlot, as: 'slot',
                    include: [{
                        model: Provider, as: 'provider',
                        include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                    }],
                }],
            });

            if (expiredAppointments.length === 0) return;

            console.log(`\n⏰ AUTO-CANCEL: Found ${expiredAppointments.length} expired pending appointment(s)`);

            for (const appointment of expiredAppointments) {
                const oldStatus = appointment.status;

                // Cancel the appointment
                appointment.status = 'cancelled';
                appointment.cancelledAt = new Date();
                await appointment.save();

                // Log history
                await StatusHistory.create({
                    appointmentId: appointment.id,
                    fromStatus: oldStatus,
                    toStatus: 'cancelled',
                    changedBy: 'system',
                    reason: `Auto-cancelled: not confirmed within ${cancelHours} hours`,
                });

                // Free the slot
                const slot = appointment.slot;
                slot.isAvailable = true;
                await slot.save();

                // Notify user
                const user = await User.findByPk(appointment.userId);
                notifyAutoCancel(
                    user.email,
                    slot.provider.user.name,
                    slot.date,
                    slot.startTime
                );

                // Promote from waitlist
                const nextInLine = await Waitlist.findOne({
                    where: { slotId: slot.id, status: 'waiting' },
                    order: [['position', 'ASC']],
                    include: [{ model: User, as: 'user' }],
                });

                if (nextInLine) {
                    const newAppointment = await Appointment.create({
                        userId: nextInLine.userId,
                        slotId: slot.id,
                        providerId: slot.providerId,
                        status: 'pending',
                        notes: 'Auto-booked from waitlist (after auto-cancel)',
                    });

                    await StatusHistory.create({
                        appointmentId: newAppointment.id,
                        fromStatus: null,
                        toStatus: 'pending',
                        changedBy: 'system',
                        reason: 'Promoted from waitlist after auto-cancel',
                    });

                    slot.isAvailable = false;
                    await slot.save();

                    nextInLine.status = 'promoted';
                    await nextInLine.save();

                    notifyWaitlistPromotion(
                        nextInLine.user.email,
                        slot.provider.user.name,
                        slot.date,
                        slot.startTime
                    );

                    console.log(`  ✅ Waitlist: ${nextInLine.user.name} promoted for slot ${slot.id}`);
                }

                console.log(`  ❌ Auto-cancelled appointment #${appointment.id}`);
            }
        } catch (error) {
            console.error('Auto-cancel job error:', error.message);
        }
    };

    // Run immediately once, then on interval
    setTimeout(runJob, 5000);
    setInterval(runJob, intervalMs);
};

module.exports = { startAutoCancelJob };

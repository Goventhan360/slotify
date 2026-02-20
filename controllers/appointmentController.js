const { validationResult } = require('express-validator');
const { Appointment, AppointmentSlot, Provider, User, StatusHistory, Waitlist } = require('../models');
const { notifyBooking, notifyReschedule, notifyCancellation, notifyConfirmation, notifyWaitlistPromotion } = require('../utils/notification');
const sendEmail = require('../utils/sendEmail');

// Helper: log status change
const logStatusChange = async (appointmentId, fromStatus, toStatus, changedBy = 'user', reason = null) => {
    await StatusHistory.create({ appointmentId, fromStatus, toStatus, changedBy, reason });
};

// Helper: promote from waitlist on cancellation
const promoteFromWaitlist = async (slotId) => {
    const nextInLine = await Waitlist.findOne({
        where: { slotId, status: 'waiting' },
        order: [['position', 'ASC']],
        include: [{ model: User, as: 'user' }],
    });

    if (!nextInLine) return null;

    const slot = await AppointmentSlot.findByPk(slotId, {
        include: [{
            model: Provider,
            as: 'provider',
            include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
        }],
    });

    // Auto-book for the waitlisted user
    const appointment = await Appointment.create({
        userId: nextInLine.userId,
        slotId,
        providerId: slot.providerId,
        status: 'pending',
        notes: 'Auto-booked from waitlist',
    });

    await logStatusChange(appointment.id, null, 'pending', 'system', 'Promoted from waitlist');

    // Mark slot as unavailable again
    slot.isAvailable = false;
    await slot.save();

    // Update waitlist entry
    nextInLine.status = 'promoted';
    await nextInLine.save();

    // Notify
    notifyWaitlistPromotion(
        nextInLine.user.email,
        slot.provider.user.name,
        slot.date,
        slot.startTime
    );

    return { appointment, promotedUser: nextInLine.user.name };
};

// POST /api/appointments — book an appointment
const bookAppointment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { slotId, notes } = req.body;

        const slot = await AppointmentSlot.findByPk(slotId, {
            include: [{
                model: Provider,
                as: 'provider',
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            }],
        });

        if (!slot) {
            return res.status(404).json({ success: false, message: 'Slot not found.' });
        }

        // Optimistic concurrency control (pre-check)
        if (!slot.isAvailable) {
            return res.status(409).json({
                success: false,
                message: 'This slot is already booked. You can join the waitlist instead.',
                hint: 'POST /api/waitlist with { "slotId": ' + slotId + ' }',
            });
        }

        // ATOMIC UPDATE: Try to lock the slot
        // Update isAvailable = false WHERE id = slotId AND isAvailable = true
        const [updatedRows] = await AppointmentSlot.update(
            { isAvailable: false },
            { where: { id: slotId, isAvailable: true } }
        );

        if (updatedRows === 0) {
            // Race condition hit: someone else booked it just now
            return res.status(409).json({
                success: false,
                message: 'This slot was just booked by someone else. You can join the waitlist.',
            });
        }

        // Proceed to create appointment
        const appointment = await Appointment.create({
            userId: req.user.id,
            slotId: slot.id,
            providerId: slot.providerId,
            status: 'pending',
            notes: notes || null,
        });

        // Log status history
        await logStatusChange(appointment.id, null, 'pending', 'user', 'Appointment booked');

        // No need to save slot again, already updated via atomic query

        const user = await User.findByPk(req.user.id);
        notifyBooking(user.email, slot.provider.user.name, slot.date, slot.startTime);

        // Send Email Notification
        await sendEmail(
            user.email,
            "✅ Appointment Confirmed - Slotify",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #2563eb; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Appointment Confirmed</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hello <b>${user.name}</b>,</p>
                    <p>Your appointment has been successfully booked. We look forward to seeing you!</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><b>📅 Date:</b> ${slot.date}</p>
                        <p style="margin: 5px 0;"><b>⏰ Time:</b> ${slot.startTime}</p>
                        <p style="margin: 5px 0;"><b>👨‍⚕️ Provider:</b> Dr. ${slot.provider.user.name}</p>
                        <p style="margin: 5px 0;"><b>🏥 Status:</b> <span style="color: #2563eb;">Pending Confirmation</span></p>
                    </div>

                    <p>If you need to reschedule or cancel, please log in to your dashboard.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    <p>© 2026 Slotify Health. All rights reserved.</p>
                </div>
            </div>
            `
        );

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully (status: pending). Provider will confirm.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/appointments/:id/confirm — provider confirms
const confirmAppointment = async (req, res, next) => {
    try {
        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
        }

        const appointment = await Appointment.findOne({
            where: { id: req.params.id, providerId: provider.id, status: 'pending' },
            include: [{
                model: AppointmentSlot, as: 'slot',
            }],
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Pending appointment not found.' });
        }

        const oldStatus = appointment.status;
        appointment.status = 'confirmed';
        appointment.confirmedAt = new Date();
        await appointment.save();

        await logStatusChange(appointment.id, oldStatus, 'confirmed', 'provider', 'Confirmed by provider');

        const user = await User.findByPk(appointment.userId);
        notifyConfirmation(user.email, provider.specialization, appointment.slot.date, appointment.slot.startTime);

        res.status(200).json({
            success: true,
            message: 'Appointment confirmed.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/appointments/:id/complete — provider marks complete
const completeAppointment = async (req, res, next) => {
    try {
        const provider = await Provider.findOne({ where: { userId: req.user.id } });
        if (!provider) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
        }

        const appointment = await Appointment.findOne({
            where: { id: req.params.id, providerId: provider.id, status: 'confirmed' },
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Confirmed appointment not found.' });
        }

        const oldStatus = appointment.status;
        appointment.status = 'completed';
        appointment.completedAt = new Date();
        await appointment.save();

        await logStatusChange(appointment.id, oldStatus, 'completed', 'provider', 'Marked as completed');

        res.status(200).json({
            success: true,
            message: 'Appointment marked as completed.',
            data: appointment,
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/appointments/:id — reschedule an appointment
const rescheduleAppointment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { newSlotId } = req.body;

        const appointment = await Appointment.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{
                model: AppointmentSlot, as: 'slot',
                include: [{
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                }],
            }],
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
        }

        if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            return res.status(400).json({ success: false, message: `Cannot reschedule a ${appointment.status} appointment.` });
        }

        const newSlot = await AppointmentSlot.findByPk(newSlotId, {
            include: [{
                model: Provider, as: 'provider',
                include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
            }],
        });

        if (!newSlot) {
            return res.status(404).json({ success: false, message: 'New slot not found.' });
        }

        if (!newSlot.isAvailable) {
            return res.status(409).json({ success: false, message: 'New slot is already booked.' });
        }

        const oldSlot = appointment.slot;
        const oldStatus = appointment.status;

        // Free old slot
        oldSlot.isAvailable = true;
        await oldSlot.save();

        // Book new slot
        newSlot.isAvailable = false;
        await newSlot.save();

        appointment.slotId = newSlot.id;
        appointment.providerId = newSlot.providerId;
        appointment.status = 'rescheduled';
        await appointment.save();

        await logStatusChange(appointment.id, oldStatus, 'rescheduled', 'user', `Rescheduled from slot ${oldSlot.id} to slot ${newSlot.id}`);

        const user = await User.findByPk(req.user.id);
        notifyReschedule(user.email, newSlot.provider.user.name, oldSlot.date, oldSlot.startTime, newSlot.date, newSlot.startTime);

        // Send Email Notification
        await sendEmail(
            user.email,
            "🔁 Appointment Rescheduled - Slotify",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Appointment Rescheduled</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hello <b>${user.name}</b>,</p>
                    <p>Your appointment has been updated to a new time slot as requested.</p>
                    
                    <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 5px 0;"><b>📅 New Date:</b> ${newSlot.date}</p>
                        <p style="margin: 5px 0;"><b>⏰ New Time:</b> ${newSlot.startTime}</p>
                        <p style="margin: 5px 0;"><b>👨‍⚕️ Provider:</b> Dr. ${newSlot.provider.user.name}</p>
                    </div>

                    <p>The previous slot has been released.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    <p>© 2026 Slotify Health. All rights reserved.</p>
                </div>
            </div>
            `
        );

        // Promote from waitlist for old slot
        const promotion = await promoteFromWaitlist(oldSlot.id);

        res.status(200).json({
            success: true,
            message: 'Appointment rescheduled successfully.',
            data: appointment,
            waitlistPromotion: promotion ? `${promotion.promotedUser} was auto-booked from waitlist` : null,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/appointments/:id — cancel an appointment
const cancelAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{
                model: AppointmentSlot, as: 'slot',
                include: [{
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                }],
            }],
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized.' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled.' });
        }

        const oldStatus = appointment.status;
        const slot = appointment.slot;

        // Free the slot
        slot.isAvailable = true;
        await slot.save();

        appointment.status = 'cancelled';
        appointment.cancelledAt = new Date();
        await appointment.save();

        await logStatusChange(appointment.id, oldStatus, 'cancelled', 'user', 'Cancelled by user');

        const user = await User.findByPk(req.user.id);
        notifyCancellation(user.email, slot.provider.user.name, slot.date, slot.startTime);

        // Send Email Notification
        await sendEmail(
            user.email,
            "❌ Appointment Cancelled - Slotify",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Appointment Cancelled</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Hello <b>${user.name}</b>,</p>
                    <p>Your appointment has been cancelled as requested.</p>
                    
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; color: #991b1b;">
                        <p style="margin: 5px 0;"><b>🚫 Cancelled Slot:</b></p>
                        <p style="margin: 5px 0;">${slot.date} at ${slot.startTime}</p>
                        <p style="margin: 5px 0;">Dr. ${slot.provider.user.name}</p>
                    </div>

                    <p>You can book a new appointment at any time via your dashboard.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                    <p>© 2026 Slotify Health. All rights reserved.</p>
                </div>
            </div>
            `
        );

        // 🔥 Promote from waitlist
        const promotion = await promoteFromWaitlist(slot.id);

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully.',
            waitlistPromotion: promotion ? `${promotion.promotedUser} was auto-booked from waitlist` : null,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/appointments/:id/timeline — full status history
const getAppointmentTimeline = async (req, res, next) => {
    try {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: StatusHistory,
                    as: 'statusHistory',
                    order: [['createdAt', 'ASC']],
                },
                { model: AppointmentSlot, as: 'slot' },
                {
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                },
            ],
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        // Check authorization
        if (req.user.role === 'user' && appointment.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized.' });
        }

        res.status(200).json({
            success: true,
            data: {
                appointment,
                timeline: appointment.statusHistory,
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/appointments — user's own appointments (or provider's assigned appointments)
const getMyAppointments = async (req, res, next) => {
    try {
        let where = { userId: req.user.id };

        // Providers see appointments assigned to them
        if (req.user.role === 'provider') {
            const provider = await Provider.findOne({ where: { userId: req.user.id } });
            if (provider) {
                where = { providerId: provider.id };
            }
        }

        const appointments = await Appointment.findAll({
            where,
            include: [
                { model: AppointmentSlot, as: 'slot' },
                {
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                },
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        next(error);
    }
};

// GET /api/appointments/all — admin views all bookings
const getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
                { model: AppointmentSlot, as: 'slot' },
                {
                    model: Provider, as: 'provider',
                    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    bookAppointment,
    confirmAppointment,
    completeAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAppointmentTimeline,
    getMyAppointments,
    getAllAppointments,
};

const { Op } = require('sequelize');
const { AppointmentSlot, Appointment, Provider, User, Waitlist } = require('../models');

/**
 * Conversational Booking Assistant
 * POST /api/chat
 * Accepts { message, context } and returns structured responses
 */
const chat = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        const msg = message.toLowerCase().trim();
        const userId = req.user?.id;

        // Intent detection via keyword matching
        let intent = 'unknown';
        let response = {};

        if (msg.includes('book') || msg.includes('appointment') || msg.includes('schedule')) {
            intent = 'book';
        } else if (msg.includes('cancel')) {
            intent = 'cancel';
        } else if (msg.includes('reschedule') || msg.includes('change')) {
            intent = 'reschedule';
        } else if (msg.includes('status') || msg.includes('my appointment') || msg.includes('check')) {
            intent = 'status';
        } else if (msg.includes('available') || msg.includes('slot') || msg.includes('free') || msg.includes('when')) {
            intent = 'slots';
        } else if (msg.includes('waitlist') || msg.includes('wait list') || msg.includes('queue')) {
            intent = 'waitlist';
        } else if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey')) {
            intent = 'greeting';
        } else if (msg.includes('help')) {
            intent = 'help';
        }

        switch (intent) {
            case 'greeting':
                response = {
                    reply: '👋 Hello! I\'m your appointment booking assistant. How can I help you today?',
                    suggestions: ['Book an appointment', 'Check available slots', 'View my appointments', 'Cancel an appointment'],
                };
                break;

            case 'help':
                response = {
                    reply: '🤖 Here\'s what I can help you with:',
                    capabilities: [
                        '📅 Book an appointment — say "book"',
                        '🔍 Check available slots — say "available slots"',
                        '📋 View your appointments — say "my appointments" or "status"',
                        '🔄 Reschedule — say "reschedule"',
                        '❌ Cancel — say "cancel"',
                        '⏳ Join waitlist — say "waitlist"',
                    ],
                    suggestions: ['Book an appointment', 'Available slots', 'My appointments'],
                };
                break;

            case 'slots': {
                const today = new Date().toISOString().split('T')[0];
                const slots = await AppointmentSlot.findAll({
                    where: { isAvailable: true, date: { [Op.gte]: today } },
                    include: [{
                        model: Provider, as: 'provider',
                        include: [{ model: User, as: 'user', attributes: ['name'] }],
                    }],
                    order: [['date', 'ASC'], ['startTime', 'ASC']],
                    limit: 5,
                });

                if (slots.length === 0) {
                    response = {
                        reply: '😔 No available slots right now. Would you like to join a waitlist?',
                        suggestions: ['Join waitlist', 'Check back later'],
                    };
                } else {
                    response = {
                        reply: `📅 Here are ${slots.length} available slot(s):`,
                        slots: slots.map((s) => ({
                            slotId: s.id,
                            provider: s.provider.user.name,
                            date: s.date,
                            time: `${s.startTime} - ${s.endTime}`,
                        })),
                        nextStep: 'To book, use: POST /api/appointments with { "slotId": <id> }',
                        suggestions: ['Book slot ' + slots[0].id, 'Show more slots'],
                    };
                }
                break;
            }

            case 'book': {
                // Extract slot ID from message if present (e.g., "book slot 3")
                const slotMatch = msg.match(/slot\s*(\d+)/);
                if (slotMatch && userId) {
                    const slotId = parseInt(slotMatch[1]);
                    const slot = await AppointmentSlot.findByPk(slotId, {
                        include: [{
                            model: Provider, as: 'provider',
                            include: [{ model: User, as: 'user', attributes: ['name'] }],
                        }],
                    });

                    if (!slot) {
                        response = { reply: `❌ Slot #${slotId} not found.`, suggestions: ['Show available slots'] };
                    } else if (!slot.isAvailable) {
                        response = {
                            reply: `⚠️ Slot #${slotId} is already booked. Want to join the waitlist?`,
                            suggestions: ['Join waitlist for slot ' + slotId, 'Show available slots'],
                        };
                    } else {
                        response = {
                            reply: `✅ Ready to book slot #${slotId} with ${slot.provider.user.name} on ${slot.date} at ${slot.startTime}.`,
                            action: { method: 'POST', url: '/api/appointments', body: { slotId } },
                            suggestions: ['Confirm booking', 'Show other slots'],
                        };
                    }
                } else {
                    response = {
                        reply: '📅 Let\'s book an appointment! First, let me show you available slots.',
                        nextStep: 'Say "available slots" to see what\'s open, or specify "book slot <number>".',
                        suggestions: ['Show available slots'],
                    };
                }
                break;
            }

            case 'status': {
                if (!userId) {
                    response = { reply: '🔒 Please log in first to view your appointments.' };
                    break;
                }

                const appointments = await Appointment.findAll({
                    where: { userId, status: { [Op.notIn]: ['cancelled'] } },
                    include: [
                        { model: AppointmentSlot, as: 'slot' },
                        {
                            model: Provider, as: 'provider',
                            include: [{ model: User, as: 'user', attributes: ['name'] }],
                        },
                    ],
                    order: [['createdAt', 'DESC']],
                    limit: 5,
                });

                if (appointments.length === 0) {
                    response = {
                        reply: '📋 You have no active appointments.',
                        suggestions: ['Book an appointment', 'Check available slots'],
                    };
                } else {
                    response = {
                        reply: `📋 You have ${appointments.length} appointment(s):`,
                        appointments: appointments.map((a) => ({
                            id: a.id,
                            provider: a.provider.user.name,
                            date: a.slot.date,
                            time: `${a.slot.startTime} - ${a.slot.endTime}`,
                            status: a.status,
                        })),
                        suggestions: ['Reschedule appointment', 'Cancel appointment'],
                    };
                }
                break;
            }

            case 'cancel': {
                if (!userId) {
                    response = { reply: '🔒 Please log in first.' };
                    break;
                }

                const apptMatch = msg.match(/(\d+)/);
                if (apptMatch) {
                    response = {
                        reply: `⚠️ To cancel appointment #${apptMatch[1]}, use:`,
                        action: { method: 'DELETE', url: `/api/appointments/${apptMatch[1]}` },
                        suggestions: ['Confirm cancellation', 'Keep appointment'],
                    };
                } else {
                    response = {
                        reply: '❌ Which appointment would you like to cancel? Say "cancel <appointment id>" or check your appointments first.',
                        suggestions: ['My appointments', 'Cancel 1'],
                    };
                }
                break;
            }

            case 'reschedule': {
                response = {
                    reply: '🔄 To reschedule, I need your appointment ID and a new slot. Use:',
                    action: { method: 'PUT', url: '/api/appointments/:id', body: { newSlotId: '<new_slot_id>' } },
                    suggestions: ['My appointments', 'Available slots'],
                };
                break;
            }

            case 'waitlist': {
                const slotMatch = msg.match(/slot\s*(\d+)/);
                if (slotMatch) {
                    response = {
                        reply: `⏳ To join the waitlist for slot #${slotMatch[1]}, use:`,
                        action: { method: 'POST', url: '/api/waitlist', body: { slotId: parseInt(slotMatch[1]) } },
                        suggestions: ['Confirm', 'Show available slots instead'],
                    };
                } else {
                    response = {
                        reply: '⏳ Which slot would you like to waitlist for? Say "waitlist slot <number>".',
                        suggestions: ['Show available slots', 'Waitlist slot 1'],
                    };
                }
                break;
            }

            default:
                response = {
                    reply: '🤔 I didn\'t quite understand that. Here are some things I can help with:',
                    suggestions: ['Book an appointment', 'Available slots', 'My appointments', 'Cancel', 'Reschedule', 'Help'],
                };
        }

        res.status(200).json({
            success: true,
            intent,
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { chat };

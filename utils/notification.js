/**
 * Mock Notification Service
 * Simulates sending email/SMS notifications by logging to console.
 */

const sendNotification = ({ to, subject, message, type = 'email' }) => {
    const timestamp = new Date().toISOString();

    console.log('\n========================================');
    console.log(`📧 MOCK NOTIFICATION (${type.toUpperCase()})`);
    console.log('========================================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Time:    ${timestamp}`);
    console.log('========================================\n');

    return {
        success: true,
        notificationId: `notif_${Date.now()}`,
        timestamp,
    };
};

const notifyBooking = (userEmail, providerName, date, time) => {
    return sendNotification({
        to: userEmail,
        subject: 'Appointment Booking Confirmation',
        message: `Your appointment with ${providerName} on ${date} at ${time} has been booked (pending confirmation).`,
    });
};

const notifyReschedule = (userEmail, providerName, oldDate, oldTime, newDate, newTime) => {
    return sendNotification({
        to: userEmail,
        subject: 'Appointment Rescheduled',
        message: `Your appointment with ${providerName} has been rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.`,
    });
};

const notifyCancellation = (userEmail, providerName, date, time) => {
    return sendNotification({
        to: userEmail,
        subject: 'Appointment Cancelled',
        message: `Your appointment with ${providerName} on ${date} at ${time} has been cancelled.`,
    });
};

const notifyConfirmation = (userEmail, providerName, date, time) => {
    return sendNotification({
        to: userEmail,
        subject: 'Appointment Confirmed ✅',
        message: `Your appointment with ${providerName} on ${date} at ${time} has been confirmed by the provider.`,
    });
};

const notifyWaitlistPromotion = (userEmail, providerName, date, time) => {
    return sendNotification({
        to: userEmail,
        subject: '🎉 Waitlist Promotion — Slot Available!',
        message: `Great news! A slot with ${providerName} on ${date} at ${time} has opened up. You have been automatically booked from the waitlist.`,
    });
};

const notifyAutoCancel = (userEmail, providerName, date, time) => {
    return sendNotification({
        to: userEmail,
        subject: 'Appointment Auto-Cancelled ⏰',
        message: `Your appointment with ${providerName} on ${date} at ${time} was auto-cancelled because it was not confirmed within the required time.`,
    });
};

const notifyWaitlistJoined = (userEmail, providerName, date, time, position) => {
    return sendNotification({
        to: userEmail,
        subject: 'Added to Waitlist',
        message: `You are #${position} on the waitlist for ${providerName} on ${date} at ${time}. We'll notify you if a spot opens up.`,
    });
};

module.exports = {
    sendNotification,
    notifyBooking,
    notifyReschedule,
    notifyCancellation,
    notifyConfirmation,
    notifyWaitlistPromotion,
    notifyAutoCancel,
    notifyWaitlistJoined,
};

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('--- MOCK EMAIL ---');
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Message: ${options.message}`);
        console.log('------------------');
        return; // Exit without sending real email
    }

    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'Date',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 3. Define Email Options
    const mailOptions = {
        from: `${process.env.FROM_NAME || 'Slotify App'} <${process.env.FROM_EMAIL || process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // Optional: Add HTML support later
    };

    // 4. Send Email
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to: ${options.email}`);
};

module.exports = sendEmail;

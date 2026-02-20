require('dotenv').config();
const nodemailer = require('nodemailer');

async function verifyEmail() {
    console.log('🔍 Testing Email Configuration...');
    console.log(`👤 User: ${process.env.EMAIL_USER}`);

    // Check if env vars are present
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ ERROR: Missing EMAIL_USER or EMAIL_PASS in .env file.');
        return;
    }

    // 1. Configure Transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        // 2. Verify Connection
        console.log('⏳ Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        // 3. Send Test Email
        console.log('⏳ Sending test email...');
        const info = await transporter.sendMail({
            from: `"Slotify Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: '✅ Slotify SMTP Test',
            text: 'If you are reading this, your email configuration is working perfectly!',
            html: '<b>If you are reading this, your email configuration is working perfectly! 🚀</b>',
        });

        console.log(`✅ Email sent: ${info.messageId}`);
        console.log('🎉 SYSTEM READY FOR EMAILS');

    } catch (error) {
        console.error('❌ Email Verification Failed:');
        console.error(error.message);

        if (error.code === 'EAUTH') {
            console.error('\nDATA HINT: Check your App Password. It should be 16 characters with no spaces.');
            console.error('Make sure 2-Step Verification is ON in your Google Account.');
        }
    }
}

verifyEmail();

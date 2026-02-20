const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    try {
        // REAL EMAIL TRANSPORTER (Gmail SMTP)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587, // Try 587 (STARTTLS) instead of 465
            secure: false, // false for 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false // Helps with some cloud SSL issues
            }
        });

        // Email options
        const mailOptions = {
            from: `"Slotify" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        // Send real email
        await transporter.sendMail(mailOptions);

        console.log(`📧 Email sent to ${to}`);
        return { success: true };

    } catch (err) {
        // MOCK MODE (Backup)
        console.error("❌ Email Send Failed:", err.message); // Log the actual error
        console.log("\n--- MOCK EMAIL TRIGGERED ---");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${html}`);
        console.log("--- END MOCK EMAIL ---\n");

        return { success: false, error: err.message };
    }
};

module.exports = sendEmail;

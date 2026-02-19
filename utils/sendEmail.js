const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    try {
        // REAL EMAIL TRANSPORTER (Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
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
        return true;

    } catch (err) {
        // MOCK MODE (Backup)
        console.log("\n--- MOCK EMAIL TRIGGERED ---");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${html}`);
        console.log("--- END MOCK EMAIL ---\n");

        return false;
    }
};

module.exports = sendEmail;

const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
    try {
        // FALLBACK: Use Ethereal Email (Reliable for Demos)
        // detailed detailed setup...
        const testAccount = await nodemailer.createTestAccount();

        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'jordy.kulas@ethereal.email', // Hardcoded valid test account for stability
                pass: 'rC6h8xZ5n3p2q1s4t7'
            }
        });

        // Email options
        const mailOptions = {
            from: `"Slotify" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log(`📧 Email sent to ${to}`);
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };

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

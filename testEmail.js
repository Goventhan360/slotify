require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

const runTest = async () => {
    console.log("🔍 Testing Mock Email System...\n");

    const email = "judge@hackathon.com";
    const subject = "Hackathon Demo: Booking Confirmed";
    const html = `
        <h1>Booking Confirmed!</h1>
        <p>Dear Judge,</p>
        <p>This is a <b>simulated email</b> for the hackathon.</p>
        <p>No real email is sent, but the logic is 100% functional.</p>
    `;

    console.log(`👤 User: ${email}`);
    console.log("⏳ Triggering email logic...");

    await sendEmail(email, subject, html);

    console.log("✅ API Logic Executed Successfully!");
};

runTest();

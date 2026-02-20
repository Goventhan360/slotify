/**
 * MOCK EMAIL SERVICE
 * 
 * Purpose: Simulates sending emails for the Hackathon Demo.
 * Functionality: Logs formatted emails to the server console.
 * Reliability: 100% (No SMTP/Internet required).
 */

const sendEmail = async (to, subject, html) => {
    const timestamp = new Date().toLocaleString();

    console.log('\n======================================================');
    console.log('📨  MOCK EMAIL SENT  (Hackathon Demo Mode)');
    console.log('======================================================');
    console.log(`🕒  Time:    ${timestamp}`);
    console.log(`👤  To:      ${to}`);
    console.log(`🏷️  Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log('📄  Message Body (HTML Preview):');
    console.log(html.replace(/<[^>]*>?/gm, '').trim().substring(0, 200) + '...'); // Strip tags for clean console view
    console.log('======================================================\n');

    // Return success to the controller
    return { success: true, message: 'Mock email logged to console' };
};

module.exports = sendEmail;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { startAutoCancelJob } = require('./utils/autoCancelJob');

// Import routes
const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slots');
const appointmentRoutes = require('./routes/appointments');
const waitlistRoutes = require('./routes/waitlist');
const dashboardRoutes = require('./routes/dashboard');
const waitTimeRoutes = require('./routes/waitTime');
const chatRoutes = require('./routes/chat');
const directoryRoutes = require('./routes/directory');

// Import models to register associations
require('./models');

const app = express();

// Middleware
app.set('trust proxy', 1); // Helper for Render/Heroku to trust HTTPS proxy
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport Config
require('./config/passport');
const passport = require('passport');
app.use(passport.initialize());

// Routes
app.get('/unauthorized', (req, res) => {
    res.status(403).json({
        success: false,
        message: 'Access denied: Email not registered. Please sign up first.',
    });
});

app.use('/api', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wait-time', waitTimeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/directory', directoryRoutes);

// Health check / API Info
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Appointment Scheduling System API',
        // ... (truncated for brevity, keep existing content if possible or just simplified health check)
        status: 'online'
    });
});

// SPA Fallback - Serve index.html for any unknown routes
// SPA Fallback - Serve index.html for any unknown routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

console.log('--- DEBUG ENV START ---');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Keys present:', Object.keys(process.env).join(', '));
console.log('--- DEBUG ENV END ---');


const seed = require('./seed');

sequelize
    .sync({ force: false }) // Back to normal
    .then(async () => {
        console.log('✅ Database synced successfully.');

        // Auto-seed test accounts
        await seed();

        // Start auto-cancel background job
        startAutoCancelJob();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📋 API docs available at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Unable to sync database:', err);
    });

module.exports = app;

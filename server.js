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

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wait-time', waitTimeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/directory', directoryRoutes);

// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Appointment Scheduling System API',
        version: '2.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/register',
                login: 'POST /api/login',
            },
            slots: {
                list: 'GET /api/slots',
                create: 'POST /api/slots (provider)',
                update: 'PUT /api/slots/:id (provider)',
                delete: 'DELETE /api/slots/:id (provider)',
            },
            appointments: {
                book: 'POST /api/appointments (user)',
                confirm: 'PATCH /api/appointments/:id/confirm (provider)',
                complete: 'PATCH /api/appointments/:id/complete (provider)',
                reschedule: 'PUT /api/appointments/:id (user)',
                cancel: 'DELETE /api/appointments/:id (user)',
                timeline: 'GET /api/appointments/:id/timeline',
                myAppointments: 'GET /api/appointments (authenticated)',
                allAppointments: 'GET /api/appointments/all (admin)',
            },
            waitlist: {
                join: 'POST /api/waitlist (user)',
                myWaitlist: 'GET /api/waitlist (authenticated)',
                leave: 'DELETE /api/waitlist/:id (user)',
            },
            dashboard: {
                providerDashboard: 'GET /api/dashboard (provider)',
            },
            waitTime: {
                predict: 'GET /api/wait-time/:providerId',
            },
            chatbot: {
                chat: 'POST /api/chat',
            },
        },
    });
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

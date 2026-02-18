const bcrypt = require('bcryptjs');
const { User, Provider } = require('./models');
require('dotenv').config();

const users = [
    {
        name: 'John Patient',
        email: 'patient@slotify.com',
        password: 'password123',
        role: 'user'
    },
    {
        name: 'Dr. Sarah Smith',
        email: 'provider@slotify.com',
        password: 'password123',
        role: 'provider',
        specialization: 'Cardiologist',
        phone: '555-0101'
    },
    {
        name: 'Admin User',
        email: 'admin@slotify.com',
        password: 'password123',
        role: 'admin'
    }
];

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        for (const u of users) {
            const existing = await User.findOne({ where: { email: u.email } });
            if (existing) {
                console.log(`⚠️  User ${u.email} already exists, skipping.`);
                continue;
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(u.password, salt);

            const newUser = await User.create({
                name: u.name,
                email: u.email,
                password: hashedPassword,
                role: u.role
            });

            if (u.role === 'provider') {
                await Provider.create({
                    userId: newUser.id,
                    specialization: u.specialization,
                    phone: u.phone
                });
            }

            console.log(`✅ Created ${u.role}: ${u.email}`);
        }

        console.log('✨ Seeding complete!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

// Run if called directly (standalone script)
if (require.main === module) {
    const sequelize = require('./config/database');
    sequelize.sync().then(() => seed()).then(() => process.exit(0));
}

module.exports = seed;

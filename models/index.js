const User = require('./User');
const Provider = require('./Provider');
const AppointmentSlot = require('./AppointmentSlot');
const Appointment = require('./Appointment');
const StatusHistory = require('./StatusHistory');
const Waitlist = require('./Waitlist');

// User <-> Provider (1:1)
User.hasOne(Provider, { foreignKey: 'userId', as: 'providerProfile' });
Provider.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Provider <-> AppointmentSlot (1:Many)
Provider.hasMany(AppointmentSlot, { foreignKey: 'providerId', as: 'slots' });
AppointmentSlot.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });

// User <-> Appointment (1:Many)
User.hasMany(Appointment, { foreignKey: 'userId', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AppointmentSlot <-> Appointment (1:1)
AppointmentSlot.hasOne(Appointment, { foreignKey: 'slotId', as: 'appointment' });
Appointment.belongsTo(AppointmentSlot, { foreignKey: 'slotId', as: 'slot' });

// Provider <-> Appointment (1:Many)
Provider.hasMany(Appointment, { foreignKey: 'providerId', as: 'appointments' });
Appointment.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });

// Appointment <-> StatusHistory (1:Many)
Appointment.hasMany(StatusHistory, { foreignKey: 'appointmentId', as: 'statusHistory' });
StatusHistory.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// User <-> Waitlist (1:Many)
User.hasMany(Waitlist, { foreignKey: 'userId', as: 'waitlistEntries' });
Waitlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AppointmentSlot <-> Waitlist (1:Many)
AppointmentSlot.hasMany(Waitlist, { foreignKey: 'slotId', as: 'waitlist' });
Waitlist.belongsTo(AppointmentSlot, { foreignKey: 'slotId', as: 'slot' });

module.exports = { User, Provider, AppointmentSlot, Appointment, StatusHistory, Waitlist };

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusHistory = sequelize.define('StatusHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fromStatus: {
        type: DataTypes.STRING,
        allowNull: true, // null for initial creation
    },
    toStatus: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    changedBy: {
        type: DataTypes.STRING, // 'user', 'provider', 'system'
        allowNull: false,
        defaultValue: 'user',
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
});

module.exports = StatusHistory;

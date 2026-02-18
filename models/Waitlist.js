const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Waitlist = sequelize.define('Waitlist', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    slotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('waiting', 'promoted', 'expired'),
        defaultValue: 'waiting',
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = Waitlist;

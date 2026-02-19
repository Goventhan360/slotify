const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Name is required' },
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Must be a valid email address' },
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for Google users
    },
    googleId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM('user', 'provider', 'admin'),
        defaultValue: 'user',
        allowNull: false,
    },
}, {
    timestamps: true,
});

module.exports = User;

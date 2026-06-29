const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Maintenance Model ────────────────────────────────────────────────────────
// Represents a maintenance log entry submitted by an engineer or admin.
// Stores the user and client IDs without enforcing foreign key constraints.
// This allows users and clients to be deleted while keeping maintenance logs.

const Maintenance = sequelize.define(
    'Maintenance',
    {
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        machine: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['Macsa ID', 'Savema', 'Sojet', 'BestCode']]
            }
        },

        maintenanceDay: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'maintenance_day'
        },

        isDone: {
            // Tracks whether the maintenance has been completed.
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_done'
        },

        // Stores the user ID only.
        // No foreign key constraint.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        },

        // Stores the client ID only.
        // No foreign key constraint.
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id'
        }
    },
    {
        tableName: 'maintenance',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Maintenance.findAll({
//     include: [
//         { model: User, as: 'user' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

User.hasMany(Maintenance, {
    foreignKey: 'user_id',
    as: 'maintenanceLogs',
    constraints: false
});

Maintenance.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    constraints: false
});

Client.hasMany(Maintenance, {
    foreignKey: 'client_id',
    as: 'maintenanceLogs',
    constraints: false
});

Maintenance.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

module.exports = Maintenance;
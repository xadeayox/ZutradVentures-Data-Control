const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Report Model ─────────────────────────────────────────────────────────────
// Represents a report submitted by any user (engineer, receptionist, admin).
// Each report stores the IDs of the user and client, but the database does
// not enforce foreign key constraints. This allows users and clients to be
// deleted without affecting existing reports.

const Report = sequelize.define(
    'Report',
    {
        reportDetails: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'report_details'
        },

        lineNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'line_number'
        },

        // Stores image paths as a JSON string.
        imagePaths: {
            type: DataTypes.TEXT,
            defaultValue: '[]',
            field: 'image_paths',

            get() {
                const value = this.getDataValue('imagePaths');
                return value ? JSON.parse(value) : [];
            },

            set(value) {
                this.setDataValue('imagePaths', JSON.stringify(value));
            }
        },

        status: {
            type: DataTypes.STRING,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'approved', 'rejected']]
            }
        },

        // Just stores the client ID.
        // No foreign key constraint.
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id'
        },

        // Just stores the user ID.
        // No foreign key constraint.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        }
    },
    {
        tableName: 'reports',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Report.findAll({
//     include: [
//         { model: User, as: 'user' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

User.hasMany(Report, {
    foreignKey: 'user_id',
    as: 'reports',
    constraints: false
});

Report.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    constraints: false
});

Client.hasMany(Report, {
    foreignKey: 'client_id',
    as: 'reports',
    constraints: false
});

Report.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

module.exports = Report;
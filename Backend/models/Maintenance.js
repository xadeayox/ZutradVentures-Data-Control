const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── Maintenance Model ────────────────────────────────────────────────────────
// Represents a maintenance log entry submitted by an engineer or admin.
// Each entry is linked to the user who logged it.

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
            // Tracks whether the maintenance has been marked as done
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_done'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,    // if user is deleted, log stays with userId as null
            field: 'user_id',
            references: {
                model: User,
                key: 'id'
            }
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,    // optional — not every maintenance needs a client
            field: 'client_id',
            references: {
                model: 'clients',
                key: 'id'
            }
        }
    },
    {
        tableName: 'maintenance',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
const Client = require('./Client');

User.hasMany(Maintenance, { foreignKey: 'user_id', as: 'maintenanceLogs', onDelete: 'SET NULL' });
Maintenance.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Client.hasMany(Maintenance, { foreignKey: 'client_id', as: 'maintenanceLogs', onDelete: 'SET NULL' });
Maintenance.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Maintenance;

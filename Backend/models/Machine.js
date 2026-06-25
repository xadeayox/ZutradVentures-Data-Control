const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Client = require('./Client');

// ─── Machine Model ────────────────────────────────────────────────────────────
// Represents a machine installed at a client's factory.
// Every machine belongs to ONE client via the clientId foreign key.
// This replaces the localStorage approach in the frontend.

const Machine = sequelize.define(
    'Machine',
    {
        serialNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,           // no two machines with the same serial number
            field: 'serial_number'
        },
        machine: {
            // The machine brand/type e.g. Macsa ID, Savema, Sojet, BestCode
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['Macsa ID', 'Savema', 'Sojet', 'BestCode']]
            }
        },
        lineInstalled: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'line_installed'
        },
        installedDate: {
            type: DataTypes.DATEONLY,   // stores date only, no time (e.g. 2024-01-15)
            allowNull: false,
            field: 'installed_date'
        },
        maintenanceCycle: {
            type: DataTypes.INTEGER,    // number of months between maintenance
            allowNull: false,
            field: 'maintenance_cycle',
            validate: {
                isIn: [[3, 4, 6]]
            }
        },
        lastMaintenanceDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'last_maintenance_date'
        },
        usageStatus: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'usage_status',
            validate: {
                isIn: [['main', 'spare', 'not in use']]
            }
        },
        clientId: {
            // Foreign key — links this machine to a client
            // If the client is deleted, all their machines are also deleted (CASCADE)
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'client_id',
            references: {
                model: Client,
                key: 'id'
            }
        }
    },
    {
        tableName: 'machines',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
// A client has many machines
// A machine belongs to one client
// onDelete: 'CASCADE' means if a client is deleted, all their machines go too

Client.hasMany(Machine, { foreignKey: 'client_id', as: 'machines', onDelete: 'CASCADE' });
Machine.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Machine;

const mongoose = require('mongoose');

// ─── Machine Model ────────────────────────────────────────────────────────────
// Represents a machine installed at a client's factory.
// Belongs to one client via the clientId reference.
// If a client is deleted, their machines are also deleted (handled in routes).

const machineSchema = new mongoose.Schema(
    {
        serialNumber: {
            type: String,
            required: true,
            unique: true
        },
        machine: {
            type: String,
            required: true,
            enum: ['Macsa ID', 'Savema', 'Sojet', 'BestCode']
        },
        lineInstalled: {
            type: Number,
            required: true
        },
        installedDate: {
            type: String,   // stored as DATEONLY string (e.g. "2024-01-15")
            required: true
        },
        maintenanceCycle: {
            type: Number,
            required: true,
            enum: [3, 4, 6]
        },
        lastMaintenanceDate: {
            type: String,
            required: true
        },
        usageStatus: {
            type: String,
            required: true,
            enum: ['main', 'spare', 'not in use']
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        clientName: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Machine', machineSchema);

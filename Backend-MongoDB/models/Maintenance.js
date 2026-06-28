const mongoose = require('mongoose');

// ─── Maintenance Model ────────────────────────────────────────────────────────
// Represents a maintenance log entry.
// userId and clientId are stored without enforced constraints so logs
// survive deletion of the associated user or client.

const maintenanceSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true
        },
        machine: {
            type: String,
            required: true,
            enum: ['Macsa ID', 'Savema', 'Sojet', 'BestCode']
        },
        maintenanceDay: {
            type: String,   // DATEONLY string e.g. "2024-03-15"
            required: true
        },
        isDone: {
            type: Boolean,
            default: false
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);

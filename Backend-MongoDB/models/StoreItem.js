const mongoose = require('mongoose');

// ─── StoreItem Model ──────────────────────────────────────────────────────────
// Unified store for machine parts across all 4 machine types.
// The machine field tells us which machine the part belongs to.

const storeItemSchema = new mongoose.Schema(
    {
        serialNumber: {
            type: String,
            required: true
        },
        partNumber: {
            type: String,
            required: true
        },
        machinePart: {
            type: String,
            required: true
        },
        machine: {
            type: String,
            required: true,
            enum: ['Macsa ID', 'Savema', 'Sojet', 'BestCode']
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true   // updatedAt used to show when quantity last changed
    }
);

module.exports = mongoose.model('StoreItem', storeItemSchema);

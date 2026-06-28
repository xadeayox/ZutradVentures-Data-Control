const mongoose = require('mongoose');

// ─── Supply Model ─────────────────────────────────────────────────────────────
// Represents goods supplied to a client factory.
// clientId and userId are stored without hard constraints.

const supplySchema = new mongoose.Schema(
    {
        goodsSupplied: {
            type: String,
            required: true
        },
        partNumber: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        supplyDate: {
            type: String,   // DATEONLY string
            required: true
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            default: null
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Supply', supplySchema);

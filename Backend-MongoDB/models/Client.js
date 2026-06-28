const mongoose = require('mongoose');

// ─── Client Model ─────────────────────────────────────────────────────────────
// Represents a client company that has machines installed at their factory.

const clientSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Client', clientSchema);

const mongoose = require('mongoose');

// ─── Report Model ─────────────────────────────────────────────────────────────
// Represents a report submitted by any user.
// userId and clientId are stored as ObjectIds but without enforced constraints —
// reports are kept even if the user or client is later deleted.

const reportSchema = new mongoose.Schema(
    {
        reportDetails: {
            type: String,
            required: true
        },
        lineNumber: {
            type: Number,
            required: true
        },
        imagePaths: {
            type: [String],
            default: []
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
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

module.exports = mongoose.model('Report', reportSchema);

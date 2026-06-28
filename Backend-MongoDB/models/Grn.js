const mongoose = require('mongoose');

// ─── GRN Model ────────────────────────────────────────────────────────────────
// Stores Goods Received Note file metadata.
// Actual files live in /uploads. clientId and uploadedById are stored without
// hard constraints so records survive user/client deletion.

const grnSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            default: null
        },
        uploadedById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        fileName: {
            type: String,
            required: true
        },
        storedName: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Grn', grnSchema);

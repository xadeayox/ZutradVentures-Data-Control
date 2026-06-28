const mongoose = require('mongoose');

// ─── Invoice Model ────────────────────────────────────────────────────────────
// Stores invoice file metadata. Actual files live in /uploads on disk.
// clientName and uploadedBy are snapshotted at upload time so records
// survive deletion of the associated client or user account.

const invoiceSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            default: null
        },
        clientName: {
            type: String,
            default: null
        },
        uploadedBy: {
            type: String,
            required: true
        },
        uploadedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        fileName: {
            type: String,
            required: true
        },
        storedFileName: {
            type: String,
            required: true
        },
        mimeType: {
            type: String,
            default: null
        },
        fileSize: {
            type: Number,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

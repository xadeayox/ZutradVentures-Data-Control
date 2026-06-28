const mongoose = require('mongoose');

// ─── Purchase Order Model ─────────────────────────────────────────────────────
// Stores Purchase Order file metadata.
// Actual files live in /uploads. References are soft — records survive
// deletion of the associated client or uploader.

const purchaseOrderSchema = new mongoose.Schema(
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

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

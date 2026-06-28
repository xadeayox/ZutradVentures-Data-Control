const mongoose = require('mongoose');

// ─── Permission Model ─────────────────────────────────────────────────────────
// Stores extra page permissions granted to specific non-admin users.
// e.g. engineer John granted access to 'store'.
// A compound unique index on (userId, page) prevents duplicates.

const permissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        page: {
            type: String,
            enum: ['store', 'maintenance', 'supply'],
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Prevent the same page from being granted twice to the same user
permissionSchema.index({ userId: 1, page: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Purchase Order Model ─────────────────────────────────────────────────────
// Stores Purchase Orders uploaded by receptionists or admins.
// Each Purchase Order stores the client and uploader IDs without enforcing
// foreign key constraints. This allows users and clients to be deleted while
// keeping purchase order records intact.
// Files are stored in the /uploads folder on disk; only their metadata lives here.

const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
        clientId: {
            // Stores the client ID only.
            // No foreign key constraint.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id'
        },

        uploadedById: {
            // Stores the uploader's user ID only.
            // No foreign key constraint.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'uploaded_by_id'
        },

        fileName: {
            // Original filename uploaded by the user.
            // e.g. "purchase-order.pdf"
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },

        storedName: {
            // Unique filename used when storing the file on disk.
            type: DataTypes.STRING,
            allowNull: false,
            field: 'stored_name'
        },

        mimeType: {
            // e.g. "application/pdf"
            type: DataTypes.STRING,
            allowNull: false,
            field: 'mime_type'
        }
    },
    {
        tableName: 'purchase_orders',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// PurchaseOrder.findAll({
//     include: [
//         { model: User, as: 'uploadedBy' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

Client.hasMany(PurchaseOrder, {
    foreignKey: 'client_id',
    as: 'purchaseOrders',
    constraints: false
});

PurchaseOrder.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

User.hasMany(PurchaseOrder, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedPurchaseOrders',
    constraints: false
});

PurchaseOrder.belongsTo(User, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedBy',
    constraints: false
});

module.exports = PurchaseOrder;
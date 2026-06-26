const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── Purchase Order Model ─────────────────────────────────────────────────────
// Stores Purchase Orders uploaded by receptionists or admins.
// Each Purchase Order is linked to a client factory and the user who uploaded it.
// Files are stored in the /uploads folder on disk; only the filename is saved here.
//
// Client FK is nullable ON DELETE SET NULL — if a client is deleted,
// the Purchase Order remains but clientId becomes null (shown as "Unknown Client" on frontend).

const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
        clientId: {
            // References the client this Purchase Order belongs to.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id',
            references: {
                model: 'clients',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        uploadedById: {
            // The user who uploaded this Purchase Order.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'uploaded_by_id',
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        fileName: {
            // Original filename as uploaded (e.g. "purchase-order.pdf")
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },
        storedName: {
            // Unique filename used on disk to avoid collisions
            type: DataTypes.STRING,
            allowNull: false,
            field: 'stored_name'
        },
        mimeType: {
            // e.g. "application/pdf", "application/vnd.ms-excel"
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

// ─── Relationships ────────────────────────────────────────────────────────────
// A Purchase Order belongs to a client. Client deletion sets clientId to null.
// A Purchase Order belongs to a user (uploader). User deletion sets uploadedById to null.

const Client = require('./Client');
Client.hasMany(PurchaseOrder, { foreignKey: 'client_id', as: 'purchaseOrders', onDelete: 'SET NULL' });
PurchaseOrder.belongsTo(Client, { foreignKey: 'client_id', as: 'client', onDelete: 'SET NULL' });

User.hasMany(PurchaseOrder, { foreignKey: 'uploaded_by_id', as: 'uploadedPurchaseOrders', onDelete: 'SET NULL' });
PurchaseOrder.belongsTo(User, { foreignKey: 'uploaded_by_id', as: 'uploadedBy', onDelete: 'SET NULL' });

module.exports = PurchaseOrder;

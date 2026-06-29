const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Invoice Model ────────────────────────────────────────────────────────────
// Stores invoice records uploaded by receptionists/admins.
// Each invoice stores the client and uploader IDs without enforcing foreign
// key constraints. This allows users and clients to be deleted while keeping
// invoice records intact.
// Files are stored on disk in the /uploads folder; only their metadata lives here.

const Invoice = sequelize.define(
    'Invoice',
    {
        clientId: {
            // Stores the client ID only.
            // No foreign key constraint.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id'
        },

        clientName: {
            // Snapshot of the client's companyName at upload time.
            // This remains even if the client is later deleted.
            type: DataTypes.STRING,
            allowNull: true,
            field: 'client_name'
        },

        uploadedBy: {
            // Snapshot of the uploader's full name.
            // This remains even if the user account is later deleted.
            type: DataTypes.STRING,
            allowNull: false,
            field: 'uploaded_by'
        },

        uploadedByUserId: {
            // Stores the uploader's user ID only.
            // No foreign key constraint.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'uploaded_by_user_id'
        },

        fileName: {
            // Original filename uploaded by the user.
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },

        storedFileName: {
            // Unique filename used when storing the file on disk.
            type: DataTypes.STRING,
            allowNull: false,
            field: 'stored_file_name'
        },

        mimeType: {
            // e.g. application/pdf
            type: DataTypes.STRING,
            allowNull: true,
            field: 'mime_type'
        },

        fileSize: {
            // File size in bytes.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'file_size'
        }
    },
    {
        tableName: 'invoices',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Invoice.findAll({
//     include: [
//         { model: User, as: 'uploader' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

User.hasMany(Invoice, {
    foreignKey: 'uploaded_by_user_id',
    as: 'invoices',
    constraints: false
});

Invoice.belongsTo(User, {
    foreignKey: 'uploaded_by_user_id',
    as: 'uploader',
    constraints: false
});

Client.hasMany(Invoice, {
    foreignKey: 'client_id',
    as: 'invoices',
    constraints: false
});

Invoice.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

module.exports = Invoice;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── GRN Model ────────────────────────────────────────────────────────────────
// Stores Goods Received Notes uploaded by receptionists or admins.
// Each GRN stores the client and uploader IDs without enforcing foreign key
// constraints. This allows users and clients to be deleted while keeping
// GRN records intact.
// Files are stored in the /uploads folder on disk; only their metadata lives here.

const Grn = sequelize.define(
    'Grn',
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
            // e.g. "delivery-note.pdf"
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },

        storedName: {
            // Unique filename used when storing the file on disk.
            // e.g. "1719123456789-delivery-note.pdf"
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
        tableName: 'grns',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Grn.findAll({
//     include: [
//         { model: User, as: 'uploadedBy' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

Client.hasMany(Grn, {
    foreignKey: 'client_id',
    as: 'grns',
    constraints: false
});

Grn.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

User.hasMany(Grn, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedGrns',
    constraints: false
});

Grn.belongsTo(User, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedBy',
    constraints: false
});

module.exports = Grn;
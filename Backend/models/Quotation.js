const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Quotation Model ──────────────────────────────────────────────────────────
// Stores quotations uploaded by receptionists or admins.
// Each quotation stores the client and uploader IDs without enforcing foreign
// key constraints. This allows users and clients to be deleted while keeping
// quotation records intact.
// Files are stored in the /uploads folder on disk; only their metadata lives here.

const Quotation = sequelize.define(
    'Quotation',
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
            // e.g. "quotation.pdf"
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
        tableName: 'quotations',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Quotation.findAll({
//     include: [
//         { model: User, as: 'uploadedBy' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

Client.hasMany(Quotation, {
    foreignKey: 'client_id',
    as: 'quotations',
    constraints: false
});

Quotation.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

User.hasMany(Quotation, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedQuotations',
    constraints: false
});

Quotation.belongsTo(User, {
    foreignKey: 'uploaded_by_id',
    as: 'uploadedBy',
    constraints: false
});

module.exports = Quotation;
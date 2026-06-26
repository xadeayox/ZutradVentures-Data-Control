const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── Quotation Model ──────────────────────────────────────────────────────────
// Stores quotations uploaded by receptionists or admins.
// Each quotation is linked to a client factory and the user who uploaded it.
// Files are stored in the /uploads folder on disk; only the filename is saved here.
//
// Client FK is nullable ON DELETE SET NULL — if a client is deleted,
// the quotation remains but clientId becomes null (shown as "Unknown Client" on frontend).

const Quotation = sequelize.define(
    'Quotation',
    {
        clientId: {
            // References the client this quotation belongs to.
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
            // The user who uploaded this quotation.
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
            // Original filename as uploaded (e.g. "quotation.pdf")
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
        tableName: 'quotations',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
// A quotation belongs to a client. Client deletion sets clientId to null.
// A quotation belongs to a user (uploader). User deletion sets uploadedById to null.

const Client = require('./Client');
Client.hasMany(Quotation, { foreignKey: 'client_id', as: 'quotations', onDelete: 'SET NULL' });
Quotation.belongsTo(Client, { foreignKey: 'client_id', as: 'client', onDelete: 'SET NULL' });

User.hasMany(Quotation, { foreignKey: 'uploaded_by_id', as: 'uploadedQuotations', onDelete: 'SET NULL' });
Quotation.belongsTo(User, { foreignKey: 'uploaded_by_id', as: 'uploadedBy', onDelete: 'SET NULL' });

module.exports = Quotation;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── GRN Model ────────────────────────────────────────────────────────────────
// Stores Goods Received Notes uploaded by receptionists or admins.
// Each GRN is linked to a client factory and the user who uploaded it.
// Files are stored in the /uploads folder on disk; only the filename is saved here.
//
// Client FK is nullable ON DELETE SET NULL — if a client is deleted,
// the GRN remains but clientId becomes null (shown as "Unknown Client" on frontend).

const Grn = sequelize.define(
    'Grn',
    {
        clientId: {
            // References the client this GRN belongs to.
            // SET NULL on delete so GRNs survive client removal.
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
            // The user who uploaded this GRN.
            // SET NULL on delete so the record is kept even if the user is removed.
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
            // Original filename as uploaded (e.g. "delivery-note.pdf")
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },
        storedName: {
            // UUID-based filename used on disk to avoid collisions
            // e.g. "1719123456789-delivery-note.pdf"
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
        tableName: 'grns',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
// A GRN belongs to a client. Client deletion sets clientId to null.
// A GRN belongs to a user (uploader). User deletion sets uploadedById to null.

const Client = require('./Client');
Client.hasMany(Grn, { foreignKey: 'client_id', as: 'grns', onDelete: 'SET NULL' });
Grn.belongsTo(Client, { foreignKey: 'client_id', as: 'client', onDelete: 'SET NULL' });

User.hasMany(Grn, { foreignKey: 'uploaded_by_id', as: 'uploadedGrns', onDelete: 'SET NULL' });
Grn.belongsTo(User, { foreignKey: 'uploaded_by_id', as: 'uploadedBy', onDelete: 'SET NULL' });

module.exports = Grn;

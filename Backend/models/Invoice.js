const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── Invoice Model ────────────────────────────────────────────────────────────
// Stores invoice records uploaded by receptionists/admins.
// Each invoice is linked to a client factory and the user who uploaded it.
// Files are stored on disk in the /uploads folder; only their metadata lives here.

const Invoice = sequelize.define(
    'Invoice',
    {
        clientId: {
            // Foreign key to the Client — nullable so invoices survive client deletion.
            // onDelete: 'SET NULL' must be on the column definition (not just the
            // association) for SQLite to generate the correct DDL.
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id',
            onDelete: 'SET NULL',
            references: {
                model: 'clients',
                key: 'id'
            }
        },
        clientName: {
            // Snapshot of the client's companyName at upload time.
            // If the client is later deleted, this preserves the display name.
            // The frontend shows this value; falls back to "Unknown Client" if null.
            type: DataTypes.STRING,
            allowNull: true,
            field: 'client_name'
        },
        uploadedBy: {
            // Full name snapshot from the JWT (firstName + surname) at upload time.
            // Stored as a plain string so the record survives user account deletion.
            type: DataTypes.STRING,
            allowNull: false,
            field: 'uploaded_by'
        },
        uploadedByUserId: {
            // Foreign key to the User who uploaded — nullable so old records survive
            // user deletion
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'uploaded_by_user_id',
            references: {
                model: User,
                key: 'id'
            }
        },
        fileName: {
            // Original file name as uploaded by the user (e.g. "invoice_march.pdf")
            type: DataTypes.STRING,
            allowNull: false,
            field: 'file_name'
        },
        storedFileName: {
            // The name we saved it as on disk — unique to prevent collisions
            // e.g. "1718200000000-invoice_march.pdf"
            type: DataTypes.STRING,
            allowNull: false,
            field: 'stored_file_name'
        },
        mimeType: {
            // e.g. "application/pdf", "application/vnd.ms-excel"
            type: DataTypes.STRING,
            allowNull: true,
            field: 'mime_type'
        },
        fileSize: {
            // File size in bytes — useful for display and validation
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'file_size'
        }
    },
    {
        tableName: 'invoices',
        timestamps: true,   // adds createdAt and updatedAt columns
        underscored: true   // maps camelCase fields to snake_case columns
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
// User → Invoice
User.hasMany(Invoice, { foreignKey: 'uploaded_by_user_id', as: 'invoices', onDelete: 'SET NULL'});
Invoice.belongsTo(User, { foreignKey: 'uploaded_by_user_id', as: 'uploader' });

// Client → Invoice
// onDelete: 'SET NULL' means deleting a client nullifies invoice.clientId
// but leaves the invoice row (and its clientName snapshot) intact.
const Client = require('./Client');
Client.hasMany(Invoice, { foreignKey: 'client_id', as: 'invoices', onDelete: 'SET NULL' });
Invoice.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Invoice;

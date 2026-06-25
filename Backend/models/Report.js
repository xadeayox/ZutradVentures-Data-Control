const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Report Model ─────────────────────────────────────────────────────────────
// Represents a report submitted by any user (engineer, receptionist, admin).
// Each report is linked to a client (factory) and the user who submitted it.
// Images are stored as file paths on the server, not as binary data in the DB.

const Report = sequelize.define(
    'Report',
    {
        reportDetails: {
            type: DataTypes.TEXT,   // TEXT instead of STRING — reports can be long
            allowNull: false,
            field: 'report_details'
        },
        lineNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'line_number'
        },
        // imagePaths stores a JSON array of file paths e.g. ["uploads/img1.jpg", "uploads/img2.jpg"]
        // We stringify it before saving and parse it when reading
        imagePaths: {
            type: DataTypes.TEXT,
            defaultValue: '[]',     // empty array by default
            field: 'image_paths',
            get() {
                // automatically parse the JSON string when reading
                const value = this.getDataValue('imagePaths');
                return value ? JSON.parse(value) : [];
            },
            set(value) {
                // automatically stringify the array when saving
                this.setDataValue('imagePaths', JSON.stringify(value));
            }
        },
        status: {
            // Visual status — only the admin can change this
            type: DataTypes.STRING,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'approved', 'rejected']]
            }
        },
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id',
            references: {
                model: Client,
                key: 'id'
            }
        },
        userId: {
            // The user who submitted the report
            // allowNull: true means if the user is deleted, the report stays
            // but userId becomes null instead of deleting the report too
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id',
            references: {
                model: User,
                key: 'id'
            }
        }
    },
    {
        tableName: 'reports',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
User.hasMany(Report, { foreignKey: 'user_id', as: 'reports', onDelete: 'SET NULL' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Client.hasMany(Report, { foreignKey: 'client_id', as: 'reports' });
Report.belongsTo(Client, { foreignKey: 'client_id', as: 'client'});

module.exports = Report;

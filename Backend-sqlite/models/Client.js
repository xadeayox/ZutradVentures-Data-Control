const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── Client Model ─────────────────────────────────────────────────────────────
// Represents a client company that has machines installed at their factory.
// A client can have many machines (defined in Machine.js).

const Client = sequelize.define(
    'Client',
    {
        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: false,           // no two clients with the same company name
            field: 'company_name'
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        tableName: 'clients',
        timestamps: true,
        underscored: true
    }
);

module.exports = Client;

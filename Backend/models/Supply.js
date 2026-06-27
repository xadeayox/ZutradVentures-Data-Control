const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Supply Model ─────────────────────────────────────────────────────────────
// Represents a supply entry — goods supplied to a client factory.
// Stores the user and client IDs without enforcing foreign key constraints.
// This allows users and clients to be deleted while keeping supply records.

const Supply = sequelize.define(
    'Supply',
    {
        goodsSupplied: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'goods_supplied'
        },

        partNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'part_number'
        },

        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        },

        supplyDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'supply_date'
        },

        // Stores the client ID only.
        // No foreign key constraint.
        clientId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'client_id'
        },

        // Stores the user ID only.
        // No foreign key constraint.
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        }
    },
    {
        tableName: 'supply',
        timestamps: true,
        underscored: true
    }
);

// ─── Sequelize Associations ───────────────────────────────────────────────────
// These associations are kept so you can still use:
//
// Supply.findAll({
//     include: [
//         { model: User, as: 'user' },
//         { model: Client, as: 'client' }
//     ]
// });
//
// The database itself no longer enforces these relationships.

Client.hasMany(Supply, {
    foreignKey: 'client_id',
    as: 'supplies',
    constraints: false
});

Supply.belongsTo(Client, {
    foreignKey: 'client_id',
    as: 'client',
    constraints: false
});

User.hasMany(Supply, {
    foreignKey: 'user_id',
    as: 'supplies',
    constraints: false
});

Supply.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
    constraints: false
});

module.exports = Supply;
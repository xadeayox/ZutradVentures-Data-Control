const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');

// ─── Supply Model ─────────────────────────────────────────────────────────────
// Represents a supply entry — goods supplied to a client factory.
// Linked to the client it was supplied to and the user who logged it.

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
            validate: { min: 1 }
        },
        supplyDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'supply_date'
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
            type: DataTypes.INTEGER,
            allowNull: true,    // if user is deleted, supply entry stays with userId as null
            field: 'user_id',
            references: {
                model: User,
                key: 'id'
            }
        }
    },
    {
        tableName: 'supply',
        timestamps: true,
        underscored: true
    }
);

// ─── Relationships ────────────────────────────────────────────────────────────
Client.hasMany(Supply, { foreignKey: 'client_id', as: 'supplies' });
Supply.belongsTo(Client, { foreignKey: 'client_id', as: 'client'});

User.hasMany(Supply, { foreignKey: 'user_id', as: 'supplies', onDelete: 'SET NULL' });
Supply.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Supply;

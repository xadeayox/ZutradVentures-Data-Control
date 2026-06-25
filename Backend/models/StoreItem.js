const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ─── StoreItem Model ──────────────────────────────────────────────────────────
// Replaces the 4 separate localStorage stores (macsaStore, savemaStore etc.)
// with one unified table. The machine column tells us which machine it belongs to.

const StoreItem = sequelize.define(
    'StoreItem',
    {
        serialNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'serial_number'
        },
        partNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'part_number'
        },
        machinePart: {
            // Name/description of the part e.g. "Laser Head", "Print Head"
            type: DataTypes.STRING,
            allowNull: false,
            field: 'machine_part'
        },
        machine: {
            // Which machine this part belongs to
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['Macsa ID', 'Savema', 'Sojet', 'BestCode']]
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 0 }
        }
    },
    {
        tableName: 'store_items',
        timestamps: true,   // updatedAt is used to show when quantity was last changed
        underscored: true
    }
);

module.exports = StoreItem;

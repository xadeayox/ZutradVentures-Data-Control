const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ─── What is this table for? ──────────────────────────────────────────────────
// Every engineer and receptionist has default pages they can access.
// This table stores EXCEPTIONS — extra pages granted to specific users.
// For example, if engineer John is granted access to /store,
// a row is created here: { userId: John's id, page: 'store' }

const Permission = sequelize.define(
    'Permission',
    {
        userId: {
            // Links this permission to a specific user
            // This is a FOREIGN KEY — it references the id column in the users table
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
                model: User,
                key: 'id'
            }
        },
        page: {
            // The page/route being granted e.g. 'store', 'maintenance', 'supply'
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['store', 'maintenance', 'supply']]
            }
        }
    },
    {
        tableName: 'permissions',
        timestamps: true,
        underscored: true,

        // This prevents the same page from being granted twice to the same user
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'page']
            }
        ]
    }
);

// ─── Relationship ─────────────────────────────────────────────────────────────
// A user can have many permissions (e.g. store + maintenance)
// A permission belongs to one user
// This lets us do: user.getPermissions() or Permission.findAll({ where: { userId } })
User.hasMany(Permission, { foreignKey: 'user_id', as: 'permissions' });
Permission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Permission;

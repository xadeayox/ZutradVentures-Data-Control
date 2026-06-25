const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

// ─── What is a Model? ─────────────────────────────────────────────────────────
// A model is the JavaScript representation of a database TABLE.
// When Sequelize sees this model, it will create (or sync) a table called "users"
// in your MySQL database with exactly these columns.

const User = sequelize.define(
    'User',     // model name — Sequelize will create a table called "users" (auto-pluralized)
    {
        // Sequelize automatically adds an "id" column (auto-increment primary key)
        // so we don't need to define it manually.

        firstName: {
            type: DataTypes.STRING,         // VARCHAR(255) in SQL
            allowNull: false,               // NOT NULL constraint
            field: 'first_name'             // actual column name in the DB (snake_case is SQL convention)
        },
        surname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,                   // UNIQUE constraint — no duplicate emails
            validate: {
                isEmail: true               // Sequelize will validate email format before saving
            }
        },
        role: {
            type: DataTypes.ENUM('administrator', 'engineer', 'receptionist'),
            // ENUM in SQL means the column only accepts one of these specific values
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isFirstLogin: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,             // every new user starts with default password
            field: 'is_first_login'
        }
    },
    {
        // ─── Model Options ─────────────────────────────────────────────────────
        tableName: 'users',                 // explicitly name the table (good practice)
        timestamps: true,                   // adds created_at and updated_at columns automatically
        underscored: true,                  // converts camelCase column names to snake_case in DB

        // ─── Hooks ─────────────────────────────────────────────────────────────
        // Hooks are lifecycle events — code that runs automatically at certain points.
        // "beforeSave" runs before any INSERT or UPDATE on this model.
        // We use it to hash the password before it ever reaches the database.
        hooks: {
            beforeSave: async (user) => {
                // Only hash if the password field was actually changed
                // This prevents double-hashing on unrelated updates
                if (user.changed('password')) {
                    const saltRounds = 10;
                    user.password = await bcrypt.hash(user.password, saltRounds);
                }
            }
        }
    }
);

// ─── Instance Method: comparePassword ────────────────────────────────────────
// We add a custom method to the User model.
// When a user logs in, we call this to safely check their entered password
// against the hashed version stored in the database.

User.prototype.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;

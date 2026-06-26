const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
    dialectOptions: {
        // SQLite ships with foreign key enforcement OFF by default.
        // This pragma turns it ON for every connection so that
        // ON DELETE SET NULL (and CASCADE) actually fire.
        pragmas: {
            foreign_keys: 1
        }
    }
});

module.exports = sequelize;
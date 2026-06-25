// ─── Seed Script ──────────────────────────────────────────────────────────────
// This populates your MySQL database with initial users.
// Run it ONCE with:  npm run seed
//
// All users are created with the default password "zutrad".
// They should reset it on first login using the Forgot Password page.

const sequelize = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

const defaultUsers = [
    {
        firstName: 'Super',
        surname: 'Admin',
        email: 'admin@zutradventures.com',
        role: 'administrator',
        password: 'zutrad'
    },
    {
        firstName: 'John',
        surname: 'Doe',
        email: 'engineer@zutradventures.com',
        role: 'engineer',
        password: 'zutrad'
    },
    {
        firstName: 'Jane',
        surname: 'Smith',
        email: 'reception@zutradventures.com',
        role: 'receptionist',
        password: 'zutrad'
    }
];

async function seedDatabase() {
    try {
        // Connect and sync tables
        await sequelize.sync({ alter: true });
        console.log('✅ Connected to MySQL');

        for (const userData of defaultUsers) {
            // findOrCreate checks if the user exists first — prevents duplicates
            // Sequelize translates this to:
            //   SELECT * FROM users WHERE email = ? — if not found, INSERT INTO users ...
            const [user, created] = await User.findOrCreate({
                where: { email: userData.email },
                defaults: userData     // only used if the record doesn't already exist
            });

            if (created) {
                console.log(`✅ Created: ${user.email} (${user.role})`);
            } else {
                console.log(`⚠️  Already exists: ${user.email} — skipped`);
            }
        }

        console.log('\n🎉 Seeding complete. Default password for all users: zutrad');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seedDatabase();

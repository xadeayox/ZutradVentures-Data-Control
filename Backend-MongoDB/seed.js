// ─── Seed Script ──────────────────────────────────────────────────────────────
// Populates MongoDB with initial users.
// Run it ONCE with:  npm run seed
//
// All users are created with the default password "zutrad".
// They should reset it on first login using the Forgot Password page.

require('dotenv').config();
const connectDB = require('./config/database');
const User = require('./models/User');

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
        await connectDB();
        console.log('✅ Connected to MongoDB');

        for (const userData of defaultUsers) {
            // Check if user already exists — prevent duplicates
            const existing = await User.findOne({ email: userData.email });

            if (existing) {
                console.log(`⚠️  Already exists: ${userData.email} — skipped`);
                continue;
            }

            // pre-save hook in User.js will hash the password automatically
            const user = await User.create(userData);
            console.log(`✅ Created: ${user.email} (${user.role})`);
        }

        console.log('\n🎉 Seeding complete. Default password for all users: zutrad');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seedDatabase();

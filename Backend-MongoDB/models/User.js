const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ─── User Model ───────────────────────────────────────────────────────────────
// Represents a staff member who can log in to the system.
// Roles: administrator, engineer, receptionist.

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true
        },
        surname: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
        },
        role: {
            type: String,
            enum: ['administrator', 'engineer', 'receptionist'],
            required: true
        },
        password: {
            type: String,
            required: true
        },
        isFirstLogin: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true   // adds createdAt and updatedAt automatically
    }
);

// ─── Pre-save hook: hash password before saving ───────────────────────────────
// Equivalent to Sequelize's beforeSave hook.
// Only hashes if the password field was actually modified.
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
});

// ─── Instance Method: comparePassword ────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ─── Helper: Generate JWT Token ───────────────────────────────────────────────
// After a successful login, we give the user a JWT (JSON Web Token).
// Think of it as a stamped pass — the frontend stores it and sends it with
// every future request so the backend knows who is asking and what role they have.
// The token contains: user id, role, and email — but NOT the password.

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            surname: user.surname
        },
        process.env.JWT_SECRET,
        { expiresIn: '3h' }     // expires after 3 hours
    );
}


// ─── POST /api/auth/login ─────────────────────────────────────────────────────
// Frontend sends:  { email, password }
// Backend returns: { token, user } on success, or an error message

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Make sure both fields were actually sent
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // 2. Look up the user in MySQL by email
        //    Sequelize translates this to: SELECT * FROM users WHERE email = ? LIMIT 1
        const user = await User.findOne({ where: { email: email.toLowerCase() } });

        if (!user) {
            // We say "invalid credentials" instead of "user not found"
            // so we don't reveal which emails exist in the system
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Compare the entered password with the stored hash
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Generate the session token
        const token = generateToken(user);

        // 5. Respond with the token and safe user data (never include the password)
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                surname: user.surname,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/auth/reset-password ───────────────────────────────────────────
// Called from the Forgot Password page.
// Frontend sends:  { email, newPassword, retypePassword }
// Since this is an internal company tool, no email OTP is needed —
// the user just provides their email and new password directly.

router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, retypePassword } = req.body;

        // 1. Validate all fields
        if (!email || !newPassword || !retypePassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Confirm both password fields match
        if (newPassword !== retypePassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // 3. Enforce minimum password length
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // 4. Find the user by email
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email' });
        }

        // 5. Update password and mark first login as done
        //    The beforeSave hook in User.js will auto-hash the new password
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();

        res.status(200).json({ message: 'Password reset successful. You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;

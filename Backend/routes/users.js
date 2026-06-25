const express = require('express');
const User = require('../models/User');
const Permission = require('../models/Permission');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this file are protected — you must be logged in to use them.
// Additionally, most are restricted to administrators only.


// ─── GET /api/users ───────────────────────────────────────────────────────────
// Fetches all users from the database.
// Used by the SpecialRoles dropdown to show real staff names.
// Also used by the admin to see all accounts.

router.get('/', protect, restrictTo('administrator'), async (req, res) => {
    try {
        // Fetch all users but EXCLUDE the password column for security
        // We also include their permissions so the frontend knows what they can access
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Permission,
                    as: 'permissions',
                    attributes: ['page']
                }
            ]
        });

        res.status(200).json({ users });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/users ──────────────────────────────────────────────────────────
// Creates a new user account.
// Only administrators can do this.
// Frontend sends: { firstName, surname, email, role }
// Default password "zutrad" is set automatically.

router.post('/', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { firstName, surname, email, role } = req.body;

        // 1. Validate all fields
        if (!firstName || !surname || !email || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // 2. Validate role value
        const allowedRoles = ['administrator', 'engineer', 'receptionist'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }

        // 3. Check if email is already in use
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // 4. Create the user with the default password
        // The beforeSave hook in User.js will automatically hash "zutrad"
        const newUser = await User.create({
            firstName,
            surname,
            email: email.toLowerCase(),
            role,
            password: 'zutrad',
            isFirstLogin: true
        });

        res.status(201).json({
            message: `User ${newUser.firstName} ${newUser.surname} created successfully.`,
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                surname: newUser.surname,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// ─── DELETE /api/users/:id ───────────────────────────────────────────────────
// Delete a user account.
// Administrators only.
// Prevents an admin from deleting their own account.

router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const userId = Number(req.params.id);

        // Prevent self deletion
        if (userId === req.user.id) {
            return res.status(403).json({
                message: 'You cannot delete your own account.'
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Remove permissions first
        await Permission.destroy({
            where: {
                userId: user.id
            }
        });

        await user.destroy();

        res.status(200).json({
            message: `${user.firstName} ${user.surname} deleted successfully.`
        });

    } catch (error) {
        console.error('Delete user error:', error);

        res.status(500).json({
            message: 'Server error. Please try again.'
        });
    }
});


// ─── POST /api/users/assign-role ─────────────────────────────────────────────
// Grants a special page permission to a specific user.
// Only administrators can do this.
// Frontend sends: { userId, page } where page is 'store', 'maintenance', or 'supply'

router.post('/assign-role', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { userId, page } = req.body;

        if (!userId || !page) {
            return res.status(400).json({ message: 'User and page are required.' });
        }

        // 1. Make sure the user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 2. Admins already have access to everything — no need to assign
        if (user.role === 'administrator') {
            return res.status(400).json({ message: 'Administrators already have full access.' });
        }

        // 3. findOrCreate prevents duplicate permissions
        // If the permission already exists, it just returns it without creating a duplicate
        const [permission, created] = await Permission.findOrCreate({
            where: { userId, page }
        });

        if (!created) {
            return res.status(409).json({
                message: `${user.firstName} already has access to ${page}.`
            });
        }

        res.status(201).json({
            message: `${user.firstName} ${user.surname} has been granted access to ${page}.`,
            permission
        });

    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/users/remove-role ───────────────────────────────────────────
// Removes a special permission from a user.
// Frontend sends: { userId, page }

router.post('/remove-role', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { userId, page } = req.body;

        const deleted = await Permission.destroy({
            where: { userId, page }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Permission not found.' });
        }

        res.status(200).json({ message: `Access to ${page} has been removed.` });

    } catch (error) {
        console.error('Remove role error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/users/my-permissions ───────────────────────────────────────────
// Returns the special permissions for the currently logged-in user.
// Used by the usePermissions hook on the frontend to show/hide nav links.
// Every logged-in user can call this for themselves.

router.get('/my-permissions', protect, async (req, res) => {
    try {
        const permissions = await Permission.findAll({
            where: { userId: req.user.id },
            attributes: ['page']
        });

        res.status(200).json({ permissions });

    } catch (error) {
        console.error('Get my permissions error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;

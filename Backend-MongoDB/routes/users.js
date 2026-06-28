const express = require('express');
const User = require('../models/User');
const Permission = require('../models/Permission');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/users ───────────────────────────────────────────────────────────
// Fetch all users (excluding password) with their permissions.

router.get('/', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }).lean();

        // Attach permissions to each user
        const userIds = users.map(u => u._id);
        const permissions = await Permission.find({ userId: { $in: userIds } }).lean();

        const usersWithPermissions = users.map(user => ({
            ...user,
            permissions: permissions
                .filter(p => String(p.userId) === String(user._id))
                .map(p => ({ page: p.page }))
        }));

        res.status(200).json({ users: usersWithPermissions });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/users ──────────────────────────────────────────────────────────
// Create a new user with the default password "zutrad".

router.post('/', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { firstName, surname, email, role } = req.body;

        if (!firstName || !surname || !email || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const allowedRoles = ['administrator', 'engineer', 'receptionist'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // pre-save hook will hash "zutrad" automatically
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
                id: newUser._id,
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
// Delete a user account. Prevents self-deletion.

router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const userId = req.params.id;

        if (String(userId) === String(req.user.id)) {
            return res.status(403).json({ message: 'You cannot delete your own account.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Remove all permissions for this user first
        await Permission.deleteMany({ userId: user._id });

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: `${user.firstName} ${user.surname} deleted successfully.`
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/users/assign-role ─────────────────────────────────────────────
// Grant a special page permission to one or more users.

router.post('/assign-role', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { userIds, page } = req.body;

        if (!userIds || !page) {
            return res.status(400).json({ message: 'Users and page are required.' });
        }

        // Normalize to array of valid IDs
        const ids = (Array.isArray(userIds) ? userIds : [userIds])
            .filter(id => id && typeof id === 'string' && id.length > 0);

        if (ids.length === 0) {
            return res.status(400).json({ message: 'No valid user IDs provided.' });
        }

        const users = await User.find({ _id: { $in: ids } });

        const foundIds = new Set(users.map(u => String(u._id)));
        const missingIds = ids.filter(id => !foundIds.has(id));

        if (missingIds.length > 0) {
            return res.status(404).json({ message: 'Some users were not found.', missingIds });
        }

        const results = await Promise.all(
            users.map(async (user) => {
                if (user.role === 'administrator') {
                    return {
                        userId: user._id,
                        name: `${user.firstName} ${user.surname}`,
                        status: 'skipped',
                        reason: 'Already an administrator.'
                    };
                }

                // findOneAndUpdate with upsert prevents duplicates (equivalent to findOrCreate)
                const existing = await Permission.findOne({ userId: user._id, page });
                if (existing) {
                    return {
                        userId: user._id,
                        name: `${user.firstName} ${user.surname}`,
                        status: 'skipped',
                        reason: `Already has access to ${page}.`
                    };
                }

                const permission = await Permission.create({ userId: user._id, page });
                return {
                    userId: user._id,
                    name: `${user.firstName} ${user.surname}`,
                    status: 'granted',
                    permission
                };
            })
        );

        const granted = results.filter(r => r.status === 'granted');
        const skipped = results.filter(r => r.status === 'skipped');

        res.status(201).json({
            message: `${granted.length} user(s) granted access to ${page}. ${skipped.length} skipped.`,
            granted,
            skipped
        });

    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/users/remove-role ─────────────────────────────────────────────
// Remove a special permission from a user.

router.post('/remove-role', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const { userId, page } = req.body;

        const result = await Permission.findOneAndDelete({ userId, page });

        if (!result) {
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

router.get('/my-permissions', protect, async (req, res) => {
    try {
        const permissions = await Permission.find(
            { userId: req.user.id },
            { page: 1, _id: 0 }
        ).lean();

        res.status(200).json({ permissions });

    } catch (error) {
        console.error('Get my permissions error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;

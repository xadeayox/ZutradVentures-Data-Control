const express = require('express');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Client = require('../models/Client');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/maintenance ─────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const logs = await Maintenance.find()
            .sort({ createdAt: -1 })
            .populate({ path: 'userId', select: '_id firstName surname' })
            .populate({ path: 'clientId', select: '_id companyName' })
            .lean();

        const shaped = logs.map(l => ({ ...l, user: l.userId, client: l.clientId }));

        res.status(200).json({ logs: shaped });

    } catch (error) {
        console.error('Get maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/maintenance/latest ─────────────────────────────────────────────
router.get('/latest', protect, async (req, res) => {
    try {
        const logs = await Maintenance.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'userId', select: 'firstName surname' })
            .populate({ path: 'clientId', select: 'companyName' })
            .lean();

        const shaped = logs.map(l => ({ ...l, user: l.userId, client: l.clientId }));

        res.status(200).json({ logs: shaped });

    } catch (error) {
        console.error('Get latest maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/maintenance ────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
    try {
        const { message, machine, maintenanceDay, clientId } = req.body;

        if (!message || !machine || !maintenanceDay || !clientId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const log = await Maintenance.create({
            message,
            machine,
            maintenanceDay,
            clientId,
            isDone: false,
            userId: req.user.id
        });

        const fullLog = await Maintenance.findById(log._id)
            .populate({ path: 'userId', select: '_id firstName surname' })
            .populate({ path: 'clientId', select: '_id companyName' })
            .lean();

        res.status(201).json({
            message: 'Maintenance log created successfully.',
            log: { ...fullLog, user: fullLog.userId, client: fullLog.clientId }
        });

    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/maintenance/:id/done ─────────────────────────────────────────
router.patch('/:id/done', protect, async (req, res) => {
    try {
        const log = await Maintenance.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ message: 'Maintenance log not found.' });
        }

        log.isDone = true;
        await log.save();

        res.status(200).json({ message: 'Marked as done.', log });

    } catch (error) {
        console.error('Mark done error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── DELETE /api/maintenance/:id ─────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('administrator'), async (req, res) => {
    try {
        const item = await Maintenance.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Maintenance not found.' });
        }

        res.status(200).json({ message: 'Maintenance deleted.' });

    } catch (error) {
        console.error('Delete maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


module.exports = router;

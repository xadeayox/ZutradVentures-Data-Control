const express = require('express');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Client = require('../models/Client');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// ─── GET /api/maintenance ─────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    try {
        const logs = await Maintenance.findAll({
            include: [
                { model: User, as: 'user', attributes: ['id', 'firstName', 'surname'] },
                { model: Client, as: 'client', attributes: ['id', 'companyName'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({ logs });

    } catch (error) {
        console.error('Get maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── GET /api/maintenance/latest ─────────────────────────────────────────────
router.get('/latest', protect, async (req, res) => {
    try {
        const logs = await Maintenance.findAll({
            include: [
                { model: User, as: 'user', attributes: ['firstName', 'surname'] },
                { model: Client, as: 'client', attributes: ['companyName'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        res.status(200).json({ logs });

    } catch (error) {
        console.error('Get latest maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── POST /api/maintenance ────────────────────────────────────────────────────
// Frontend sends: { message, machine, maintenanceDay, clientId }
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

        const fullLog = await Maintenance.findByPk(log.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'firstName', 'surname'] },
                { model: Client, as: 'client', attributes: ['id', 'companyName'] }
            ]
        });

        res.status(201).json({
            message: 'Maintenance log created successfully.',
            log: fullLog
        });

    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


// ─── PATCH /api/maintenance/:id/done ─────────────────────────────────────────
router.patch('/:id/done', protect, async (req, res) => {
    try {
        const log = await Maintenance.findByPk(req.params.id);

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


module.exports = router;
